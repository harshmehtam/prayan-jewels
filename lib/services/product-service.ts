import { cookiesClient } from '@/utils/amplify-utils';
import type { Product, ProductSearchResult, ProductFilters } from '@/types';
import { getProductReviews } from './review-service';

// Simple cache to prevent duplicate requests
const requestCache = new Map<string, { data: ProductSearchResult; timestamp: number }>();
const productCache = new Map<string, { data: Product | null; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Helper function to create cache key
function createCacheKey(filters: ProductFilters, limit: number, nextToken?: string): string {
  return JSON.stringify({ filters, limit, nextToken });
}

// Helper function to transform product data
const transformProduct = (product: any, stats: any): Product => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    actualPrice: product.actualPrice,
    images: product.images?.filter((img: string | null): img is string => img !== null) || [],
    isActive: product.isActive,
    viewCount: product.viewCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    averageRating: stats.averageRating > 0 ? stats.averageRating : null,
    totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
    purchaseCount: Math.floor((product.viewCount || 0) * 0.1),
  };
};

// Helper function to batch fetch review stats for multiple products
const batchGetProductReviewStats = async (productIds: string[]): Promise<Map<string, any>> => {
  const results = new Map();

  // Process in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize);

    const batchPromises = batch.map(async (productId) => {
      const { stats } = await getProductReviews(productId);
      return { productId, stats };
    });

    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach(({ productId, stats }) => {
      results.set(productId, stats);
    });
  }

  return results;
};

// Get products with filtering and pagination using Amplify Gen2 nextToken approach
export const getProducts = async (
  filters: ProductFilters = {},
  limit: number = 20,
  nextToken?: string
): Promise<ProductSearchResult> => {
  const cacheKey = createCacheKey(filters, limit, nextToken);
  const cached = requestCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const client = await cookiesClient;

    // Build the GraphQL filter
    let graphqlFilter: any = {
      isActive: { eq: true }
    };

    // Add price range filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      graphqlFilter.price = {};
      if (filters.minPrice !== undefined) {
        graphqlFilter.price.ge = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        graphqlFilter.price.le = filters.maxPrice;
      }
    }

    // Add search query filter (search in name and description)
    if (filters.searchQuery) {
      graphqlFilter.or = [
        { name: { contains: filters.searchQuery } },
        { description: { contains: filters.searchQuery } }
      ];
    }

    // Fetch products with nextToken pagination
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

    // Transform products to match expected interface and fetch real ratings
    const productIds = data.map(p => p.id);
    const reviewStatsMap = await batchGetProductReviewStats(productIds);

    let transformedProducts: Product[] = data.map((product) => {
      const stats = reviewStatsMap.get(product.id) || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      return transformProduct(product, stats);
    });

    // Client-side sorting (since Amplify doesn't support complex sorting natively)
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          transformedProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          transformedProducts.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          transformedProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
        case 'newest':
          transformedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'popularity':
          transformedProducts.sort((a, b) => {
            const scoreA = (a.purchaseCount || 0) * 2 + (a.viewCount || 0) + (a.averageRating || 0) * 10;
            const scoreB = (b.purchaseCount || 0) * 2 + (b.viewCount || 0) + (b.averageRating || 0) * 10;
            return scoreB - scoreA;
          });
          break;
        case 'most-relevant':
        default:
          transformedProducts.sort((a, b) => {
            const scoreA = (a.purchaseCount || 0) * 2 + (a.viewCount || 0) + (a.averageRating || 0) * 10;
            const scoreB = (b.purchaseCount || 0) * 2 + (b.viewCount || 0) + (b.averageRating || 0) * 10;
            return scoreB - scoreA;
          });
          break;
      }
    }

    const result = {
      products: transformedProducts,
      totalCount: transformedProducts.length, // Only count current page
      hasNextPage: !!newNextToken,
      nextToken: newNextToken || undefined,
    };

    // Cache the result
    requestCache.set(cacheKey, {
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
};

// Get a single product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  const cached = productCache.get(id);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const client = await cookiesClient;
    const { data, errors } = await client.models.Product.get({ id }, {
      authMode: 'iam'
    });

    if (errors) {
      console.error('Error fetching product:', errors);
      return null;
    }

    if (!data) {
      return null;
    }

    // Get real review stats for this product directly from review service
    const { stats } = await getProductReviews(id);

    // Transform to match expected Product interface
    const transformedProduct = transformProduct(data, stats);

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
};

// Get multiple products by IDs in a single call
export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
  if (!ids.length) return [];

  try {
    // Since Amplify doesn't support "in" filter directly, we'll make individual calls
    // but batch them together for better performance
    const productPromises = ids.map(id => getProductById(id));
    const products = await Promise.all(productPromises);

    // Filter out null results
    return products.filter((product): product is Product => product !== null);
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    return [];
  }
};

// Get products by price range (specific method for price range cards)
export const getProductsByPriceRange = async (maxPrice: number, limit: number = 12): Promise<Product[]> => {
  try {
    const result = await getProducts({
      maxPrice,
      sortBy: 'price-asc'
    }, limit);

    return result.products;
  } catch (error) {
    console.error('Error fetching products by price range:', error);
    return [];
  }
};