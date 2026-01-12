// // Real product service using Amplify API
// import { getClient } from '@/lib/amplify-client';
// import { ReviewCache } from '@/lib/utils/review-cache';
// import type { Product, ProductSearchResult, ProductFilters } from '@/types';

// // Simple cache to prevent duplicate requests
// const requestCache = new Map<string, Promise<ProductSearchResult>>();
// const productCache = new Map<string, Promise<Product | null>>();
// const CACHE_DURATION = 30000; // 30 seconds

// // Helper function to create cache key
// function createCacheKey(filters: ProductFilters, limit: number): string {
//   return JSON.stringify({ filters, limit });
// }

// export class ProductService {
//   // Get products with filtering and search
//   static async getProducts(
//     filters: ProductFilters = {},
//     limit: number = 20
//   ): Promise<ProductSearchResult> {
//     const cacheKey = createCacheKey(filters, limit);
    
//     // Check if request is already in progress
//     if (requestCache.has(cacheKey)) {
//       return requestCache.get(cacheKey)!;
//     }

//     // Create new request
//     const requestPromise = this._fetchProducts(filters, limit);
    
//     // Cache the promise
//     requestCache.set(cacheKey, requestPromise);
    
//     // Remove from cache after duration
//     setTimeout(() => {
//       requestCache.delete(cacheKey);
//     }, CACHE_DURATION);
    
//     return requestPromise;
//   }

//   // Internal method to actually fetch products
//   private static async _fetchProducts(
//     filters: ProductFilters = {},
//     limit: number = 20
//   ): Promise<ProductSearchResult> {
//     try {
//       const client = await getClient();

//       // Build the GraphQL filter
//       let graphqlFilter: any = {
//         isActive: { eq: true } // Only show active products
//       };

//       // Add price range filters
//       if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
//         graphqlFilter.price = {};
//         if (filters.minPrice !== undefined) {
//           graphqlFilter.price.ge = filters.minPrice;
//         }
//         if (filters.maxPrice !== undefined) {
//           graphqlFilter.price.le = filters.maxPrice;
//         }
//       }

//       // Add search query filter (search in name and description)
//       if (filters.searchQuery) {
//         graphqlFilter.or = [
//           { name: { contains: filters.searchQuery } },
//           { description: { contains: filters.searchQuery } }
//         ];
//       }

//       // Execute the query
//       const result = await client.models.Product.list({
//         filter: graphqlFilter,
//         limit
//       });

//       if (!result.data) {
//         return {
//           products: [],
//           totalCount: 0,
//           hasNextPage: false,
//           nextToken: undefined,
//           suggestions: []
//         };
//       }

//       // Transform products to match expected interface and fetch real ratings
//       const productIds = result.data.map(p => p.id);
//       const reviewStatsMap = await ReviewCache.batchGetProductReviewStats(productIds);
      
//       const transformedProducts: Product[] = result.data.map((product) => {
//         const stats = reviewStatsMap.get(product.id) || {
//           averageRating: 0,
//           totalReviews: 0,
//           ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
//         };
        
//         return {
//           id: product.id,
//           name: product.name,
//           description: product.description,
//           price: product.price,
//           actualPrice: product.actualPrice, // Add actualPrice field
//           images: product.images?.filter((img): img is string => img !== null) || [],
//           isActive: product.isActive,
//           viewCount: product.viewCount,
//           createdAt: product.createdAt,
//           updatedAt: product.updatedAt,
//           // Use real review data instead of static values
//           averageRating: stats.averageRating > 0 ? stats.averageRating : null,
//           totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
//           purchaseCount: Math.floor((product.viewCount || 0) * 0.1), // Estimate based on views
//         };
//       });

//       // Apply sorting if specified
//       if (filters.sortBy) {
//         transformedProducts.sort((a, b) => {
//           switch (filters.sortBy) {
//             case 'price-asc':
//               return a.price - b.price;
//             case 'price-desc':
//               return b.price - a.price;
//             case 'name':
//               return a.name.localeCompare(b.name);
//             case 'newest':
//               return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//             case 'popularity':
//               return (b.viewCount || 0) - (a.viewCount || 0);
//             case 'rating':
//               return (b.averageRating || 0) - (a.averageRating || 0);
//             case 'most-relevant':
//             default:
//               return 0;
//           }
//         });
//       }

//       return {
//         products: transformedProducts,
//         totalCount: transformedProducts.length,
//         hasNextPage: false,
//         nextToken: undefined,
//       };
//     } catch (error) {
//       return {
//         products: [],
//         totalCount: 0,
//         hasNextPage: false,
//         nextToken: undefined,
//       };
//     }
//   }

//   // Get multiple products by IDs in a single call
//   static async getProductsByIds(ids: string[]): Promise<Product[]> {
//     if (!ids.length) return [];

//     try {
//       // Since Amplify doesn't support "in" filter directly, we'll make individual calls
//       // but batch them together for better performance
//       const productPromises = ids.map(id => this.getProductById(id));
//       const products = await Promise.all(productPromises);
      
//       // Filter out null results
//       return products.filter((product): product is Product => product !== null);
//     } catch (error) {
//       console.error('Error fetching products by IDs:', error);
//       return [];
//     }
//   }

//   // Get a single product by ID
//   static async getProductById(id: string): Promise<Product | null> {
//     // Check if request is already in progress
//     if (productCache.has(id)) {
//       return productCache.get(id)!;
//     }

//     // Create new request
//     const requestPromise = this._fetchProductById(id);
    
//     // Cache the promise
//     productCache.set(id, requestPromise);
    
//     // Remove from cache after duration
//     setTimeout(() => {
//       productCache.delete(id);
//     }, CACHE_DURATION);
    
//     return requestPromise;
//   }

//   // Internal method to actually fetch product by ID
//   private static async _fetchProductById(id: string): Promise<Product | null> {
//     try {
//       const client = await getClient();
//       const result = await client.models.Product.get({ id });

//       if (!result.data) {
//         return null;
//       }

//       const product = result.data;

//       // Get real review stats for this product
//       const stats = await ReviewCache.getProductReviewStats(id);

//       // Transform to match expected Product interface
//       const transformedProduct: Product = {
//         id: product.id,
//         name: product.name,
//         description: product.description,
//         price: product.price,
//         actualPrice: product.actualPrice, // Add actualPrice field
//         images: product.images?.filter((img): img is string => img !== null) || [],
//         isActive: product.isActive,
//         viewCount: product.viewCount,
//         createdAt: product.createdAt,
//         updatedAt: product.updatedAt,
//         // Use real review data instead of static values
//         averageRating: stats.averageRating > 0 ? stats.averageRating : null,
//         totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
//         purchaseCount: Math.floor((product.viewCount || 0) * 0.1), // Estimate based on views
//       };

//       return transformedProduct;
//     } catch (error) {
//       console.error('Error fetching product:', error);
//       return null;
//     }
//   }

//   // Get products by price range (specific method for price range cards)
//   static async getProductsByPriceRange(maxPrice: number, limit: number = 12): Promise<Product[]> {
//     try {
//       const result = await this.getProducts({
//         maxPrice,
//         sortBy: 'price-asc'
//       }, limit);

//       return result.products;
//     } catch (error) {
//       console.error('Error fetching products by price range:', error);
//       return [];
//     }
//   }
// }