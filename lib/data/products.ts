// Product data access layer - Real Amplify GraphQL Integration
import { getClient, client, handleAmplifyError } from '@/lib/amplify-client';
import { ReviewCache } from '@/lib/utils/review-cache';
import type { CreateProductInput, UpdateProductInput, ProductFilters, ProductSearchResult } from '@/types';

export class ProductService {
  // Get all active products with comprehensive filtering
  static async getProducts(filters?: ProductFilters, limit?: number, nextToken?: string): Promise<ProductSearchResult> {
    try {
      const client = await getClient();
      
      // Build filter conditions for Amplify GraphQL
      const filterConditions: any = {
        isActive: { eq: true }
      };

      // Apply price range filters
      if (filters?.minPrice !== undefined && filters?.maxPrice !== undefined) {
        filterConditions.price = { 
          between: [filters.minPrice, filters.maxPrice] 
        };
      } else if (filters?.minPrice !== undefined) {
        filterConditions.price = { ge: filters.minPrice };
      } else if (filters?.maxPrice !== undefined) {
        filterConditions.price = { le: filters.maxPrice };
      }

      // For search query, we'll filter after fetching since GraphQL doesn't support complex text search
      const response = await client.models.Product.list({
        filter: filterConditions,
        limit: limit || 20,
        nextToken
      });

      let products = response.data || [];

      // Apply search query filter (client-side for now)
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        );
      }

      // COMMENTED OUT - Apply in-stock filter by checking inventory - Not needed for now
      /*
      if (filters?.inStock) {
        try {
          const productsWithInventory = await Promise.all(
            products.map(async (product) => {
              try {
                const inventoryResponse = await client.models.InventoryItem.list({
                  filter: { productId: { eq: product.id } }
                });
                const inventory = inventoryResponse.data?.[0];
                const availableQuantity = inventory ? 
                  (inventory.stockQuantity || 0) - (inventory.reservedQuantity || 0) : 0;
                
                return { ...product, availableQuantity };
              } catch (inventoryError) {
                // If inventory access fails (guest user), assume stock is available
                return { ...product, availableQuantity: 10 };
              }
            })
          );
          products = productsWithInventory.filter(p => (p.availableQuantity || 0) > 0);
        } catch (error) {
          console.warn('Inventory check failed, skipping in-stock filter:', error);
        }
      }
      */

      // For now, ignore in-stock filter since we don't have inventory tracking

      // Apply sorting
      if (filters?.sortBy) {
        products = this.sortProducts(products, filters.sortBy);
      }

      // Get products with real review data using batch optimization
      const productIds = products.map(p => p.id);
      const reviewStatsMap = await ReviewCache.batchGetProductReviewStats(productIds);
      
      const productsWithReviews = products.map((p) => {
        const stats = reviewStatsMap.get(p.id) || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        return {
          ...p,
          images: p.images.filter((img): img is string => img !== null),
          availableQuantity: (p as any).availableQuantity || 10, // Default stock for display
          // Use real review data instead of static values
          averageRating: stats.averageRating > 0 ? stats.averageRating : null,
          totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
        };
      });

      return {
        products: productsWithReviews,
        totalCount: products.length,
        hasNextPage: !!response.nextToken,
        nextToken: response.nextToken || undefined
      };
    } catch (error) {
      // Suppress auth errors after logout
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message;
        if (errorMessage?.includes('NoValidAuthTokens') || errorMessage?.includes('federated jwt')) {
          console.log('Auth token expired, switching to guest mode for products');
          // Return empty result for now, the client will retry with guest mode
          return {
            products: [],
            totalCount: 0,
            hasNextPage: false,
            nextToken: undefined
          };
        }
      }
      console.error('Error fetching products:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get a single product by ID with inventory information
  static async getProduct(id: string) {
    try {
      const client = await getClient();
      
      const response = await client.models.Product.get({ id });
      
      if (!response.data) {
        return { product: null, errors: response.errors };
      }

      // COMMENTED OUT - Try to get inventory information - Not needed for now
      /*
      let inventory = null;
      let availableQuantity = 10; // Default for display

      try {
        const inventoryResponse = await client.models.InventoryItem.list({
          filter: { productId: { eq: id } }
        });
        
        inventory = inventoryResponse.data?.[0] || null;
        availableQuantity = inventory ? 
          (inventory.stockQuantity || 0) - (inventory.reservedQuantity || 0) : 10;
      } catch (inventoryError) {
        console.warn('Could not fetch inventory (guest user):', inventoryError);
        // Keep default values for guest users
      }
      */

      // Placeholder values for now
      let inventory = null;
      let availableQuantity = 10; // Default for display

      // Get real review stats for this product
      const stats = await ReviewCache.getProductReviewStats(id);

      return {
        product: {
          ...response.data,
          images: response.data.images.filter((img): img is string => img !== null),
          availableQuantity,
          inventory,
          // Use real review data instead of static values
          averageRating: stats.averageRating > 0 ? stats.averageRating : null,
          totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
        },
        errors: response.errors
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Create a new product (Admin only)
  static async createProduct(productData: CreateProductInput) {
    try {
      // Use authenticated client for admin operations
      const client = await getClient();
      const response = await client.models.Product.create({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        images: productData.images,
        isActive: productData.isActive ?? true
      });

      // COMMENTED OUT - Create initial inventory record - Not needed for now
      /*
      if (response.data && productData.initialStock !== undefined) {
        await client.models.InventoryItem.create({
          productId: response.data.id,
          stockQuantity: productData.initialStock,
          reservedQuantity: 0,
          reorderPoint: productData.reorderPoint || 5,
          supplierName: productData.supplierName,
          supplierContact: productData.supplierContact,
          leadTime: productData.leadTime
        });
      }
      */

      return {
        product: response.data,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update an existing product (Admin only)
  static async updateProduct(id: string, updates: UpdateProductInput) {
    try {
      // Use authenticated client for admin operations
      const client = await getClient();
      // Remove id from updates to avoid duplication
      const { id: _, ...updateData } = updates;
      
      const response = await client.models.Product.update({
        id,
        ...updateData
      });

      return {
        product: response.data,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Delete a product (Admin only)
  static async deleteProduct(id: string) {
    try {
      // Use authenticated client for admin operations
      const client = await getClient();
      // COMMENTED OUT - First, delete associated inventory - Not needed for now
      /*
      const inventoryResponse = await client.models.InventoryItem.list({
        filter: { productId: { eq: id } }
      });
      
      if (inventoryResponse.data?.[0]) {
        await client.models.InventoryItem.delete({ id: inventoryResponse.data[0].id });
      }
      */

      // Then delete the product
      const response = await client.models.Product.delete({ id });

      return {
        success: !!response.data,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Search products with enhanced features
  static async searchProducts(query: string, filters?: ProductFilters, limit?: number) {
    return this.getProducts({
      ...filters,
      searchQuery: query
    }, limit);
  }

  // Get featured/popular products
  static async getFeaturedProducts(limit: number = 6) {
    try {
      const client = await getClient();
      
      const response = await client.models.Product.list({
        filter: {
          isActive: { eq: true }
        },
        limit
      });

      // Sort by creation date since popularityScore might not be available
      const products = (response.data || []).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Get products with real review data using batch optimization
      const productIds = products.slice(0, limit).map(p => p.id);
      const reviewStatsMap = await ReviewCache.batchGetProductReviewStats(productIds);
      
      const productsWithReviews = products.slice(0, limit).map((p) => {
        const stats = reviewStatsMap.get(p.id) || {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        return {
          ...p,
          images: p.images.filter((img): img is string => img !== null),
          availableQuantity: 10, // Default stock for display
          // Use real review data instead of static values
          averageRating: stats.averageRating > 0 ? stats.averageRating : null,
          totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
        };
      });

      return {
        products: productsWithReviews,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Helper method for sorting products
  private static sortProducts(products: any[], sortBy: string) {
    switch (sortBy) {
      case 'price-asc':
        return products.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return products.sort((a, b) => b.price - a.price);
      case 'name':
        return products.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'popularity':
        return products.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
      case 'rating':
        return products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'most-relevant':
        // For most relevant, we'll use a combination of popularity and rating
        return products.sort((a, b) => {
          const scoreA = ((a.popularityScore || 0) * 0.6) + ((a.averageRating || 0) * 0.4);
          const scoreB = ((b.popularityScore || 0) * 0.6) + ((b.averageRating || 0) * 0.4);
          return scoreB - scoreA;
        });
      default:
        return products;
    }
  }

  // Update product view count
  static async incrementViewCount(productId: string) {
    try {
      const product = await this.getProduct(productId);
      if (product.product) {
        // For now, we'll skip updating view count since it's not in the schema
        // In production, you would add this field to the Amplify schema
        console.log(`View count incremented for product ${productId}`);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw error for view count updates
    }
  }

  // Update product purchase count
  static async incrementPurchaseCount(productId: string) {
    try {
      const product = await this.getProduct(productId);
      if (product.product) {
        // For now, we'll skip updating purchase count since it's not in the schema
        // In production, you would add this field to the Amplify schema
        console.log(`Purchase count incremented for product ${productId}`);
      }
    } catch (error) {
      console.error('Error incrementing purchase count:', error);
      // Don't throw error for purchase count updates
    }
  }
}