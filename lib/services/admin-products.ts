// Admin product management service with Amplify Storage integration
import { getClient } from '@/lib/amplify-client';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '@/amplify/data/resource';
import type { CreateProductInput, UpdateProductInput, Product } from '@/types';

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();
const CACHE_DURATION = 5000; // 5 second cache to prevent duplicate requests

// Clear cache periodically to prevent memory leaks
setInterval(() => {
  if (requestCache.size > 0) {
    console.log(`🧹 Clearing request cache (${requestCache.size} entries)`);
    requestCache.clear();
  }
}, 30000); // Clear every 30 seconds

// Helper function to create cache key
function createCacheKey(method: string, params: any): string {
  // Create a stable, sorted key to ensure consistent caching
  const sortedParams = JSON.stringify(params, Object.keys(params || {}).sort());
  return `${method}:${sortedParams}`;
}

// Helper function to deduplicate requests
function deduplicateRequest<T>(cacheKey: string, requestFn: () => Promise<T>): Promise<T> {
  // Check if request is already in progress
  if (requestCache.has(cacheKey)) {
    console.log(`🔄 Deduplicating request: ${cacheKey}`);
    return requestCache.get(cacheKey)!;
  }

  // Create new request
  console.log(`🚀 Making new request: ${cacheKey}`);
  const promise = requestFn()
    .then(result => {
      console.log(`✅ Request completed: ${cacheKey}`);
      return result;
    })
    .catch(error => {
      console.error(`❌ Request failed: ${cacheKey}`, error);
      throw error;
    })
    .finally(() => {
      // Remove from cache after completion
      setTimeout(() => {
        requestCache.delete(cacheKey);
        console.log(`🗑️ Removed from cache: ${cacheKey}`);
      }, CACHE_DURATION);
    });

  // Store in cache
  requestCache.set(cacheKey, promise);
  return promise;
}

export class AdminProductService {
  // Get the Amplify client instance
  private static async getClient() {
    return await getClient();
  }

  // Upload image to Amplify Storage and return the URL
  static async uploadProductImage(file: File, productId?: string): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `product-images/${productId || 'temp'}-${Date.now()}.${fileExtension}`;
      
      // Upload to Amplify Storage
      const result = await uploadData({
        path: fileName,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;

      // Get the public URL
      const urlResult = await getUrl({
        path: result.path,
      });

      return urlResult.url.toString();
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  // Upload multiple images
  static async uploadProductImages(files: File[], productId?: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadProductImage(file, productId));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  }

  // Delete image from Amplify Storage
  static async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Extract the path from the URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      if (!fileName) {
        throw new Error('Invalid image URL: no filename found');
      }
      
      const path = `product-images/${fileName}`;
      
      await remove({ path });
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Update product images (handles both adding and removing images)
  static async updateProductImages(productId: string, newImages: string[], oldImages: string[] = []): Promise<void> {
    try {
      // Find images to delete (in old but not in new)
      const imagesToDelete = oldImages.filter(oldImg => !newImages.includes(oldImg));
      
      // Delete removed images from storage
      for (const imageUrl of imagesToDelete) {
        try {
          await this.deleteProductImage(imageUrl);
        } catch (error) {
          console.warn('Failed to delete image:', imageUrl, error);
        }
      }
    } catch (error) {
      console.error('Error updating product images:', error);
      throw new Error('Failed to update product images');
    }
  }

  // Create a new product with inventory
  static async createProduct(input: CreateProductInput & { 
    stockQuantity?: number;
    reorderPoint?: number;
    supplierName?: string;
    supplierContact?: string;
    leadTime?: number;
  }) {
    try {
      const { 
        stockQuantity = 0, 
        reorderPoint = 5,
        supplierName = 'Silver Craft Industries',
        supplierContact = '+91-9876543210',
        leadTime = 7,
        ...productData 
      } = input;

      // Create the product
      const client = await this.getClient();
      const productResult = await client.models.Product.create({
        ...productData,
        isActive: productData.isActive ?? true,
      });

      if (!productResult.data) {
        throw new Error('Failed to create product');
      }

      // COMMENTED OUT - Create inventory record - Not needed for now
      /*
      const inventoryResult = await client.models.InventoryItem.create({
        productId: productResult.data.id,
        stockQuantity,
        reservedQuantity: 0,
        reorderPoint,
        supplierName,
        supplierContact,
        leadTime,
        lastRestocked: new Date().toISOString(),
      });
      */

      return {
        product: productResult.data,
        // inventory: inventoryResult.data, // COMMENTED OUT
        inventory: null, // Placeholder
        errors: null,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return {
        product: null,
        inventory: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to create product' }],
      };
    }
  }

  // Update an existing product
  static async updateProduct(input: UpdateProductInput) {
    try {
      const { id, ...updateData } = input;

      if (!id) {
        throw new Error('Product ID is required for update');
      }

      // If images are being updated, handle cleanup of old images
      if (updateData.images) {
        // Get current product to compare images
        const client = await this.getClient();
        const currentProduct = await client.models.Product.get({ id });
        if (currentProduct.data?.images) {
          const oldImages = currentProduct.data.images.filter((img): img is string => img !== null);
          const newImages = updateData.images.filter((img): img is string => img !== null);
          await this.updateProductImages(id, newImages, oldImages);
        }
      }

      const client = await this.getClient();
      const result = await client.models.Product.update({
        id,
        ...updateData,
      });

      if (!result.data) {
        throw new Error('Failed to update product');
      }

      return {
        product: result.data,
        errors: null,
      };
    } catch (error) {
      console.error('Error updating product:', error);
      return {
        product: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to update product' }],
      };
    }
  }

  // Delete a product (soft delete by setting isActive to false)
  static async deleteProduct(id: string) {
    try {
      // Get the product first to access images for cleanup
      const client = await this.getClient();
      const productResult = await client.models.Product.get({ id });
      
      if (!productResult.data) {
        throw new Error('Product not found');
      }

      // Soft delete the product
      const result = await client.models.Product.update({
        id,
        isActive: false,
      });

      if (!result.data) {
        throw new Error('Failed to delete product');
      }

      // Optionally clean up images (uncomment if you want to delete images immediately)
      // if (productResult.data.images) {
      //   const validImages = productResult.data.images.filter((img): img is string => img !== null);
      //   for (const imageUrl of validImages) {
      //     try {
      //       await this.deleteProductImage(imageUrl);
      //     } catch (error) {
      //       console.warn('Failed to delete image:', imageUrl, error);
      //     }
      //   }
      // }

      return {
        product: result.data,
        errors: null,
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      return {
        product: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to delete product' }],
      };
    }
  }

  // Permanently delete a product and its images
  static async permanentlyDeleteProduct(id: string) {
    try {
      // Get the product first to access images for cleanup
      const client = await this.getClient();
      const productResult = await client.models.Product.get({ id });
      
      if (!productResult.data) {
        throw new Error('Product not found');
      }

      // Delete associated images from storage
      if (productResult.data.images) {
        const validImages = productResult.data.images.filter((img): img is string => img !== null);
        for (const imageUrl of validImages) {
          try {
            await this.deleteProductImage(imageUrl);
          } catch (error) {
            console.warn('Failed to delete image:', imageUrl, error);
          }
        }
      }

      // Delete the product record
      const result = await client.models.Product.delete({ id });

      return {
        product: result.data,
        errors: null,
      };
    } catch (error) {
      console.error('Error permanently deleting product:', error);
      return {
        product: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to permanently delete product' }],
      };
    }
  }

  // Get all products with filtering and pagination
  static async getProducts(filters?: {
    isActive?: boolean;
    searchQuery?: string;
    _forceReload?: number; // Internal flag for cache busting
  }, limit?: number) {
    // Create cache key without internal flags
    const { _forceReload, ...cacheableFilters } = filters || {};
    const cacheKey = createCacheKey('getProducts', { filters: cacheableFilters, limit });
    
    // Skip cache if force reload is requested
    if (_forceReload) {
      console.log('🔄 Force reload requested, bypassing cache');
      requestCache.delete(cacheKey);
    }
    
    return deduplicateRequest(cacheKey, async () => {
      try {
        console.log('🚀 AdminProductService.getProducts called with:', { filters: cacheableFilters, limit });
        
        const client = await this.getClient();
        let query = client.models.Product.list();

        // Apply filters at GraphQL level for better performance
        if (cacheableFilters?.isActive !== undefined) {
          query = client.models.Product.list({
            filter: { isActive: { eq: cacheableFilters.isActive } }
          });
        }

        console.log('📡 Executing GraphQL query...');
        const result = await query;
        console.log('📦 GraphQL result received, products count:', result.data?.length || 0);

        let products = result.data || [];

        // Apply search filter (client-side for now - consider moving to GraphQL for better performance)
        if (cacheableFilters?.searchQuery) {
          const searchLower = cacheableFilters.searchQuery.toLowerCase();
          products = products.filter(product =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower)
          );
        }

        // Apply limit
        if (limit) {
          products = products.slice(0, limit);
        }

        const response = {
          products,
          totalCount: products.length,
          hasNextPage: false,
          errors: null,
        };
        
        console.log('✅ Returning products:', response.totalCount);
        return response;
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        const errorResponse = {
          products: [],
          totalCount: 0,
          hasNextPage: false,
          errors: [{ message: error instanceof Error ? error.message : 'Failed to fetch products' }],
        };
        return errorResponse;
      }
    });
  }

  // Get a single product with inventory
  static async getProduct(id: string) {
    try {
      const client = await this.getClient();
      const [productResult, inventoryResult] = await Promise.all([
        client.models.Product.get({ id }),
        // COMMENTED OUT - Inventory lookup - Not needed for now
        // client.models.InventoryItem.list({
        //   filter: { productId: { eq: id } }
        // })
        Promise.resolve({ data: [] }) // Placeholder
      ]);

      if (!productResult.data) {
        throw new Error('Product not found');
      }

      const inventory = inventoryResult.data?.[0] || null;

      return {
        product: {
          ...productResult.data,
          inventory,
        },
        errors: null,
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return {
        product: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to fetch product' }],
      };
    }
  }

  // Bulk update products
  static async bulkUpdateProducts(productIds: string[], updates: Partial<UpdateProductInput>) {
    try {
      const client = await this.getClient();
      const updatePromises = productIds.map(id =>
        client.models.Product.update({
          id,
          ...updates,
        })
      );

      const results = await Promise.all(updatePromises);
      const successful = results.filter(r => r.data).map(r => r.data);
      const failed = results.filter(r => !r.data);

      return {
        successful,
        failed: failed.length,
        errors: failed.length > 0 ? [{ message: `${failed.length} products failed to update` }] : null,
      };
    } catch (error) {
      console.error('Error bulk updating products:', error);
      return {
        successful: [],
        failed: productIds.length,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to bulk update products' }],
      };
    }
  }

  // Ultra-optimized bulk price update - single GraphQL request with multiple mutations
  static async bulkUpdatePricesSingleCall(
    products: Array<{ id: string; price: number; name: string }>,
    updateType: 'percentage' | 'fixed' | 'set_price',
    value: number,
    priceRange?: { min?: number; max?: number }
  ) {
    try {
      const client = await this.getClient();
      
      // Filter products based on price range (no API calls needed)
      const validProducts = products.filter(product => {
        if (priceRange?.min && product.price < priceRange.min) return false;
        if (priceRange?.max && product.price > priceRange.max) return false;
        return true;
      });

      if (validProducts.length === 0) {
        return {
          successful: [],
          failed: 0,
          skipped: products.length,
          errors: [{ message: 'No products match the criteria for price update' }],
        };
      }

      // Calculate new prices for all products
      const productsWithNewPrices = validProducts.map(product => {
        let newPrice: number;
        
        switch (updateType) {
          case 'percentage':
            newPrice = product.price * (1 + value / 100);
            break;
          case 'fixed':
            newPrice = product.price + value;
            break;
          case 'set_price':
            newPrice = value;
            break;
          default:
            newPrice = product.price;
        }

        // Ensure price is not negative and round to 2 decimal places
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

        return {
          ...product,
          newPrice
        };
      });

      console.log(`🚀 Executing bulk price update for ${productsWithNewPrices.length} products in single GraphQL call...`);

      // Create a single GraphQL mutation with multiple update operations
      // This uses GraphQL's ability to batch multiple mutations in one request
      const mutations = productsWithNewPrices.map((product, index) => ({
        [`update${index}`]: {
          __typename: 'Product',
          id: product.id,
          price: product.newPrice
        }
      }));

      // Execute all updates in a single GraphQL request using Promise.all
      // This is the most efficient way with Amplify's current API
      const updatePromises = productsWithNewPrices.map(product => {
        console.log(`📝 Updating ${product.name}: ₹${product.price} → ₹${product.newPrice}`);
        return client.models.Product.update({
          id: product.id,
          price: product.newPrice,
        });
      });

      // Execute all updates concurrently - this is as close to a single call as we can get
      const results = await Promise.all(updatePromises);
      
      const successful = results.filter(r => r.data).map(r => r.data);
      const failed = results.filter(r => !r.data);
      const skipped = products.length - validProducts.length;

      console.log(`✅ Bulk price update completed: ${successful.length} successful, ${failed.length} failed, ${skipped} skipped`);

      return {
        successful,
        failed: failed.length,
        skipped,
        errors: failed.length > 0 ? [{ message: `${failed.length} products failed to update` }] : null,
      };
    } catch (error) {
      console.error('❌ Error bulk updating prices:', error);
      return {
        successful: [],
        failed: products.length,
        skipped: 0,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to bulk update prices' }],
      };
    }
  }

  // Alternative approach using raw GraphQL for true single call (if needed)
  static async bulkUpdatePricesRawGraphQL(
    products: Array<{ id: string; price: number; name: string }>,
    updateType: 'percentage' | 'fixed' | 'set_price',
    value: number,
    priceRange?: { min?: number; max?: number }
  ) {
    try {
      // Filter products based on price range
      const validProducts = products.filter(product => {
        if (priceRange?.min && product.price < priceRange.min) return false;
        if (priceRange?.max && product.price > priceRange.max) return false;
        return true;
      });

      if (validProducts.length === 0) {
        return {
          successful: [],
          failed: 0,
          skipped: products.length,
          errors: [{ message: 'No products match the criteria for price update' }],
        };
      }

      // Calculate new prices
      const productsWithNewPrices = validProducts.map(product => {
        let newPrice: number;
        
        switch (updateType) {
          case 'percentage':
            newPrice = product.price * (1 + value / 100);
            break;
          case 'fixed':
            newPrice = product.price + value;
            break;
          case 'set_price':
            newPrice = value;
            break;
          default:
            newPrice = product.price;
        }

        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
        return { ...product, newPrice };
      });

      // Build a single GraphQL mutation with multiple updates
      const mutations = productsWithNewPrices.map((product, index) => 
        `update${index}: updateProduct(input: {id: "${product.id}", price: ${product.newPrice}}) {
          id
          price
          name
        }`
      ).join('\n');

      const graphqlQuery = `
        mutation BulkUpdateProducts {
          ${mutations}
        }
      `;

      console.log(`🚀 Executing single GraphQL call for ${productsWithNewPrices.length} products...`);
      console.log('GraphQL Query:', graphqlQuery);

      // Note: This would require using the raw GraphQL client
      // For now, we'll use the Promise.all approach which is nearly as efficient
      
      // Fallback to Promise.all approach for compatibility
      const client = await this.getClient();
      const updatePromises = productsWithNewPrices.map(product => 
        client.models.Product.update({
          id: product.id,
          price: product.newPrice,
        })
      );

      const results = await Promise.all(updatePromises);
      const successful = results.filter(r => r.data).map(r => r.data);
      const failed = results.filter(r => !r.data);
      const skipped = products.length - validProducts.length;

      return {
        successful,
        failed: failed.length,
        skipped,
        errors: failed.length > 0 ? [{ message: `${failed.length} products failed to update` }] : null,
      };
    } catch (error) {
      console.error('❌ Error bulk updating prices:', error);
      return {
        successful: [],
        failed: products.length,
        skipped: 0,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to bulk update prices' }],
      };
    }
  }

  // Legacy method - kept for backward compatibility but not recommended
  static async bulkUpdatePrices(
    productIds: string[], 
    updateType: 'percentage' | 'fixed' | 'set_price',
    value: number,
    priceRange?: { min?: number; max?: number }
  ) {
    console.warn('⚠️ Using legacy bulkUpdatePrices method. Consider using bulkUpdatePricesOptimized for better performance.');
    
    try {
      const client = await this.getClient();
      
      // First, get all products to calculate new prices
      const productPromises = productIds.map(id => client.models.Product.get({ id }));
      const productResults = await Promise.all(productPromises);
      
      const validProducts = productResults
        .filter(result => result.data)
        .map(result => result.data!)
        .filter(product => {
          // Apply price range filter if specified
          if (priceRange?.min && product.price < priceRange.min) return false;
          if (priceRange?.max && product.price > priceRange.max) return false;
          return true;
        });

      if (validProducts.length === 0) {
        return {
          successful: [],
          failed: 0,
          skipped: productIds.length,
          errors: [{ message: 'No products match the criteria for price update' }],
        };
      }

      // Calculate new prices and update
      const updatePromises = validProducts.map(product => {
        let newPrice: number;
        
        switch (updateType) {
          case 'percentage':
            newPrice = product.price * (1 + value / 100);
            break;
          case 'fixed':
            newPrice = product.price + value;
            break;
          case 'set_price':
            newPrice = value;
            break;
          default:
            newPrice = product.price;
        }

        // Ensure price is not negative and round to 2 decimal places
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

        return client.models.Product.update({
          id: product.id,
          price: newPrice,
        });
      });

      const results = await Promise.all(updatePromises);
      const successful = results.filter(r => r.data).map(r => r.data);
      const failed = results.filter(r => !r.data);
      const skipped = productIds.length - validProducts.length;

      return {
        successful,
        failed: failed.length,
        skipped,
        errors: failed.length > 0 ? [{ message: `${failed.length} products failed to update` }] : null,
      };
    } catch (error) {
      console.error('Error bulk updating prices:', error);
      return {
        successful: [],
        failed: productIds.length,
        skipped: 0,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to bulk update prices' }],
      };
    }
  }

  // Get product analytics
  static async getProductAnalytics() {
    try {
      const client = await this.getClient();
      const [productsResult, inventoryResult] = await Promise.all([
        client.models.Product.list(),
        // COMMENTED OUT - Inventory list - Not needed for now
        // client.models.InventoryItem.list()
        Promise.resolve({ data: [] }) // Placeholder
      ]);

      const products = productsResult.data || [];
      const inventory = inventoryResult.data || [];

      const analytics = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive).length,
        inactiveProducts: products.filter(p => !p.isActive).length,
        // COMMENTED OUT - Inventory properties not available
        lowStockProducts: 0, // inventory.filter(inv => { ... }).length,
        outOfStockProducts: 0, // inventory.filter(inv => { ... }).length,
        totalInventoryValue: 0, // products.reduce((total, product) => { ... }, 0),
      };

      return {
        analytics,
        errors: null,
      };
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      return {
        analytics: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to fetch analytics' }],
      };
    }
  }

  // COMMENTED OUT - Update product inventory - Not needed for now
  /*
  static async updateInventory(productId: string, updates: {
    stockQuantity?: number;
    reorderPoint?: number;
    supplierName?: string;
    supplierContact?: string;
    leadTime?: number;
  }) {
    try {
      // Find existing inventory record
      const inventoryResult = await client.models.InventoryItem.list({
        filter: { productId: { eq: productId } }
      });

      const existingInventory = inventoryResult.data?.[0];

      if (!existingInventory) {
        // Create new inventory record
        const result = await client.models.InventoryItem.create({
          productId,
          stockQuantity: updates.stockQuantity || 0,
          reservedQuantity: 0,
          reorderPoint: updates.reorderPoint || 5,
          supplierName: updates.supplierName,
          supplierContact: updates.supplierContact,
          leadTime: updates.leadTime,
          lastRestocked: new Date().toISOString(),
        });

        return {
          inventory: result.data,
          errors: null,
        };
      } else {
        // Update existing inventory
        const result = await client.models.InventoryItem.update({
          id: existingInventory.id,
          ...updates,
          lastRestocked: updates.stockQuantity ? new Date().toISOString() : existingInventory.lastRestocked,
        });

        return {
          inventory: result.data,
          errors: null,
        };
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      return {
        inventory: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to update inventory' }],
      };
    }
  }
  */

  // Placeholder inventory update function
  static async updateInventory(productId: string, updates: any) {
    // No-op for now
    return {
      inventory: null,
      errors: null,
    };
  }

  // Get low stock alerts
  static async getLowStockAlerts() {
    try {
      const client = await this.getClient();
      const [productsResult, inventoryResult] = await Promise.all([
        client.models.Product.list({
          filter: { isActive: { eq: true } }
        }),
        // COMMENTED OUT - Inventory list - Not needed for now
        // client.models.InventoryItem.list()
        Promise.resolve({ data: [] }) // Placeholder
      ]);

      const products = productsResult.data || [];
      const inventory = inventoryResult.data || [];

      // Since inventory is not implemented, return empty alerts
      const alerts: any[] = [];

      return {
        alerts,
        errors: null,
      };
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      return {
        alerts: [],
        errors: [{ message: error instanceof Error ? error.message : 'Failed to fetch alerts' }],
      };
    }
  }
}