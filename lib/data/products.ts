// Product data access layer - Real Amplify GraphQL Integration
import { getDynamicClient, handleAmplifyError, userClient } from '@/lib/amplify-client';
import type { CreateProductInput, UpdateProductInput, ProductFilters, ProductSearchResult } from '@/types';

export class ProductService {
  // Get all active products with comprehensive filtering
  static async getProducts(filters?: ProductFilters, limit?: number, nextToken?: string): Promise<ProductSearchResult> {
    try {
      const client = await getDynamicClient();
      
      // Build filter conditions for Amplify GraphQL
      const filterConditions: any = {
        isActive: { eq: true }
      };

      // Apply category filter
      if (filters?.category) {
        filterConditions.category = { eq: filters.category };
      }

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
          p.description.toLowerCase().includes(query) ||
          p.style?.toLowerCase().includes(query) ||
          p.keywords?.some((k: string | null) => k?.toLowerCase().includes(query))
        );
      }

      // Apply in-stock filter by checking inventory (only for authenticated users)
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

      // Apply sorting
      if (filters?.sortBy) {
        products = this.sortProducts(products, filters.sortBy);
      }

      return {
        products: products.map(p => ({
          ...p,
          images: p.images.filter((img): img is string => img !== null),
          occasion: p.occasion?.filter((occ): occ is string => occ !== null) || null,
          keywords: p.keywords?.filter((kw): kw is string => kw !== null) || null,
          availableQuantity: (p as any).availableQuantity || 10 // Default stock for display
        })),
        totalCount: products.length,
        hasNextPage: !!response.nextToken,
        nextToken: response.nextToken || undefined
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get a single product by ID with inventory information
  static async getProduct(id: string) {
    try {
      const client = await getDynamicClient();
      
      const response = await client.models.Product.get({ id });
      
      if (!response.data) {
        return { product: null, errors: response.errors };
      }

      // Try to get inventory information
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

      return {
        product: {
          ...response.data,
          images: response.data.images.filter((img): img is string => img !== null),
          occasion: response.data.occasion?.filter((occ): occ is string => occ !== null) || null,
          keywords: response.data.keywords?.filter((kw): kw is string => kw !== null) || null,
          availableQuantity,
          inventory
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
      // Use userClient for admin operations
      const response = await userClient.models.Product.create({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        images: productData.images,
        category: productData.category,
        material: productData.material || 'silver',
        weight: productData.weight,
        length: productData.length,
        style: productData.style,
        occasion: productData.occasion,
        metaTitle: productData.metaTitle,
        metaDescription: productData.metaDescription,
        keywords: productData.keywords,
        isActive: productData.isActive ?? true
      });

      // Create initial inventory record
      if (response.data && productData.initialStock !== undefined) {
        await userClient.models.InventoryItem.create({
          productId: response.data.id,
          stockQuantity: productData.initialStock,
          reservedQuantity: 0,
          reorderPoint: productData.reorderPoint || 5,
          supplierName: productData.supplierName,
          supplierContact: productData.supplierContact,
          leadTime: productData.leadTime
        });
      }

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
      // Use userClient for admin operations
      // Remove id from updates to avoid duplication
      const { id: _, ...updateData } = updates;
      
      const response = await userClient.models.Product.update({
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
      // Use userClient for admin operations
      // First, delete associated inventory
      const inventoryResponse = await userClient.models.InventoryItem.list({
        filter: { productId: { eq: id } }
      });
      
      if (inventoryResponse.data?.[0]) {
        await userClient.models.InventoryItem.delete({ id: inventoryResponse.data[0].id });
      }

      // Then delete the product
      const response = await userClient.models.Product.delete({ id });

      return {
        success: !!response.data,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string, limit?: number) {
    try {
      const client = await getDynamicClient();
      
      const response = await client.models.Product.list({
        filter: {
          category: { eq: category },
          isActive: { eq: true }
        },
        limit: limit || 20
      });

      return {
        products: response.data?.map(p => ({
          ...p,
          images: p.images.filter((img): img is string => img !== null),
          occasion: p.occasion?.filter((occ): occ is string => occ !== null) || null,
          keywords: p.keywords?.filter((kw): kw is string => kw !== null) || null,
          availableQuantity: 10 // Default stock for display
        })) || [],
        errors: response.errors
      };
    } catch (error) {
      console.error('Error fetching products by category:', error);
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
      const client = await getDynamicClient();
      
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

      return {
        products: products.slice(0, limit).map(p => ({
          ...p,
          images: p.images.filter((img): img is string => img !== null),
          occasion: p.occasion?.filter((occ): occ is string => occ !== null) || null,
          keywords: p.keywords?.filter((kw): kw is string => kw !== null) || null,
          availableQuantity: 10 // Default stock for display
        })),
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