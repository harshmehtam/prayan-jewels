import { cookiesClient } from '@/utils/amplify-utils';
import { unstable_noStore as noStore } from 'next/cache';
import { getImageUrl } from '@/lib/utils/image-utils';
import type { Product, ProductSearchResult, ProductFilters } from '@/types';
import { getProductReviews, batchGetProductReviewStats } from './review-service';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (URLs are valid for 2 hours, so we can cache longer)

// Simple cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry<ProductSearchResult>>();
const productCache = new Map<string, CacheEntry<Product>>();

// Helper: Create cache key from filters
function createCacheKey(filters: ProductFilters, limit: number, nextToken?: string): string {
  return JSON.stringify({ filters, limit, nextToken });
}

// Helper: Check if cache entry is valid
function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.timestamp < CACHE_DURATION;
}

// Helper: Transform raw product data to Product type with resolved image URLs
async function transformProduct(product: Record<string, unknown>, stats: { averageRating: number; totalReviews: number }): Promise<Product> {
  // Resolve image URLs from S3 paths in parallel for better performance
  const imagePaths = (product.images as (string | null)[] | undefined)?.filter((img: string | null): img is string => img !== null) || [];
  
  // Use Promise.all to resolve all URLs in parallel instead of sequentially
  const imageUrlPromises = imagePaths.map((imagePath: string) => getImageUrl(imagePath, 7200)); // 2 hour expiry
  const imageUrls = (await Promise.all(imageUrlPromises)).filter((url): url is string => url !== null);

  return {
    id: product.id as string,
    name: product.name as string,
    description: product.description as string,
    price: product.price as number,
    actualPrice: product.actualPrice as number,
    images: imageUrls, // Now contains resolved URLs instead of S3 paths
    isActive: product.isActive as boolean,
    viewCount: product.viewCount as number,
    createdAt: product.createdAt as string,
    updatedAt: product.updatedAt as string,
    averageRating: stats.averageRating > 0 ? stats.averageRating : null,
    totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
    purchaseCount: Math.floor(((product.viewCount as number) || 0) * 0.1),
  };
}

// Helper: Batch fetch review stats for multiple products
async function batchGetReviewStats(productIds: string[]): Promise<Map<string, { averageRating: number; totalReviews: number; ratingDistribution: Record<number, number> }>> {
  // Use the optimized batch function from review-service
  return await batchGetProductReviewStats(productIds);
}

// Helper: Sort products based on sort criteria
function sortProducts(products: Product[], sortBy?: string): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    
    case 'rating':
      return sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    
    case 'popularity':
    case 'most-relevant':
    default:
      return sorted.sort((a, b) => {
        const scoreA = (a.purchaseCount || 0) * 2 + (a.viewCount || 0) + (a.averageRating || 0) * 10;
        const scoreB = (b.purchaseCount || 0) * 2 + (b.viewCount || 0) + (b.averageRating || 0) * 10;
        return scoreB - scoreA;
      });
  }
}

// Helper: Build GraphQL filter from product filters
function buildGraphQLFilter(filters: ProductFilters): Record<string, unknown> {
  const graphqlFilter: Record<string, unknown> = {
    isActive: { eq: true }
  };

  // Price range filters
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (filters.minPrice !== undefined) {
      priceFilter.ge = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      priceFilter.le = filters.maxPrice;
    }
    graphqlFilter.price = priceFilter;
  }

  // Search query filter
  if (filters.searchQuery) {
    graphqlFilter.or = [
      { name: { contains: filters.searchQuery } },
      { description: { contains: filters.searchQuery } }
    ];
  }

  return graphqlFilter;
}

/**
 * Get products with filtering, sorting, and pagination
 */
export async function getProducts(
  filters: ProductFilters = {},
  limit: number = 20,
  nextToken?: string
): Promise<ProductSearchResult> {
  noStore(); // Explicitly mark as dynamic since we use cookiesClient
  
  const cacheKey = createCacheKey(filters, limit, nextToken);
  const cached = searchCache.get(cacheKey);

  if (isCacheValid(cached)) {
    return cached.data;
  }

  try {
    const client = await cookiesClient;
    const graphqlFilter = buildGraphQLFilter(filters);

    const { data, errors, nextToken: newNextToken } = await client.models.Product.list({
      filter: graphqlFilter,
      limit,
      nextToken,
      authMode: 'iam'
    });

    if (errors) {
      console.error('Error fetching products:', errors);
      return {
        products: [],
        totalCount: 0,
        hasNextPage: false,
        nextToken: undefined,
      };
    }

    if (!data || data.length === 0) {
      return {
        products: [],
        totalCount: 0,
        hasNextPage: false,
        nextToken: undefined,
      };
    }

    // Fetch review stats for all products
    const productIds = data.map(p => p.id);
    const reviewStatsMap = await batchGetReviewStats(productIds);

    // Transform and enrich products with review stats (now async)
    const transformedProducts = await Promise.all(
      data.map(async (product) => {
        const stats = reviewStatsMap.get(product.id) || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        return await transformProduct(product, stats);
      })
    );

    // Sort products
    const sortedProducts = sortProducts(transformedProducts, filters.sortBy);

    const result = {
      products: sortedProducts,
      totalCount: sortedProducts.length,
      hasNextPage: !!newNextToken,
      nextToken: newNextToken || undefined,
    };

    // Cache the result
    searchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      products: [],
      totalCount: 0,
      hasNextPage: false,
      nextToken: undefined,
    };
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  noStore(); // Explicitly mark as dynamic since we use cookiesClient
  
  const cached = productCache.get(id);

  if (isCacheValid(cached)) {
    return cached.data;
  }

  try {
    const client = await cookiesClient;
    const { data, errors } = await client.models.Product.get(
      { id },
      { authMode: 'iam' }
    );

    if (errors || !data) {
      console.error('Error fetching product:', errors);
      return null;
    }

    // Get review stats
    const { stats } = await getProductReviews(id);
    const transformedProduct = await transformProduct(data, stats);

    // Cache the result
    productCache.set(id, {
      data: transformedProduct,
      timestamp: Date.now(),
    });

    return transformedProduct;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Get multiple products by IDs (batch fetch)
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];

  try {
    // Check cache first for all IDs
    const uncachedIds: string[] = [];
    const cachedProducts: Product[] = [];

    ids.forEach(id => {
      const cached = productCache.get(id);
      if (isCacheValid(cached)) {
        cachedProducts.push(cached.data);
      } else {
        uncachedIds.push(id);
      }
    });

    // Fetch uncached products
    if (uncachedIds.length > 0) {
      const fetchedProducts = await Promise.all(
        uncachedIds.map(id => getProductById(id))
      );

      const validProducts = fetchedProducts.filter(
        (product): product is Product => product !== null
      );

      return [...cachedProducts, ...validProducts];
    }

    return cachedProducts;
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    return [];
  }
}

/**
 * Get products by price range
 */
export async function getProductsByPriceRange(
  maxPrice: number, 
  limit: number = 12
): Promise<Product[]> {
  try {
    const result = await getProducts(
      { maxPrice, sortBy: 'price-asc' },
      limit
    );
    return result.products;
  } catch (error) {
    console.error('Error fetching products by price range:', error);
    return [];
  }
}

/**
 * Clear product cache (useful for admin updates)
 */
export function clearProductCache(productId?: string): void {
  if (productId) {
    productCache.delete(productId);
    // Clear search cache as well since it may contain this product
    searchCache.clear();
  } else {
    productCache.clear();
    searchCache.clear();
  }
}

/**
 * Increment product view count
 */
export async function incrementProductViewCount(productId: string): Promise<void> {
  try {
    const client = await cookiesClient;
    const { data } = await client.models.Product.get(
      { id: productId },
      { authMode: 'iam' }
    );

    if (data) {
      await client.models.Product.update({
        id: productId,
        viewCount: (data.viewCount || 0) + 1,
      }, {
        authMode: 'iam'
      });

      // Invalidate cache for this product
      clearProductCache(productId);
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}