// Admin product management service with Amplify Storage integration
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '@/amplify/data/resource';
import type { CreateProductInput, UpdateProductInput, Product } from '@/types';

const client = generateClient<Schema>();

export class AdminProductService {
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
  static async createProduct(input: CreateProductInput & { stockQuantity?: number }) {
    try {
      const { stockQuantity = 0, ...productData } = input;

      // Create the product
      const productResult = await client.models.Product.create({
        ...productData,
        material: productData.material || 'silver',
        isActive: productData.isActive ?? true,
      });

      if (!productResult.data) {
        throw new Error('Failed to create product');
      }

      // Create inventory record
      const inventoryResult = await client.models.InventoryItem.create({
        productId: productResult.data.id,
        stockQuantity,
        reservedQuantity: 0,
        reorderPoint: 5,
        supplierName: 'Silver Craft Industries',
        supplierContact: '+91-9876543210',
        leadTime: 7,
        lastRestocked: new Date().toISOString(),
      });

      return {
        product: productResult.data,
        inventory: inventoryResult.data,
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

      // If images are being updated, handle cleanup of old images
      if (updateData.images) {
        // Get current product to compare images
        const currentProduct = await client.models.Product.get({ id });
        if (currentProduct.data?.images) {
          const oldImages = currentProduct.data.images.filter((img): img is string => img !== null);
          const newImages = updateData.images.filter((img): img is string => img !== null);
          await this.updateProductImages(id, newImages, oldImages);
        }
      }

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
    category?: 'traditional' | 'modern' | 'designer';
    isActive?: boolean;
    searchQuery?: string;
  }, limit?: number) {
    try {
      let query = client.models.Product.list();

      // Apply filters
      if (filters?.category) {
        query = client.models.Product.list({
          filter: { category: { eq: filters.category } }
        });
      }

      if (filters?.isActive !== undefined) {
        query = client.models.Product.list({
          filter: { isActive: { eq: filters.isActive } }
        });
      }

      const result = await query;

      let products = result.data || [];

      // Apply search filter (client-side for now)
      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        products = products.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.style?.toLowerCase().includes(searchLower)
        );
      }

      // Apply limit
      if (limit) {
        products = products.slice(0, limit);
      }

      return {
        products,
        totalCount: products.length,
        hasNextPage: false,
        errors: null,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        products: [],
        totalCount: 0,
        hasNextPage: false,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to fetch products' }],
      };
    }
  }

  // Get a single product with inventory
  static async getProduct(id: string) {
    try {
      const [productResult, inventoryResult] = await Promise.all([
        client.models.Product.get({ id }),
        client.models.InventoryItem.list({
          filter: { productId: { eq: id } }
        })
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

  // Get product analytics
  static async getProductAnalytics() {
    try {
      const [productsResult, inventoryResult] = await Promise.all([
        client.models.Product.list(),
        client.models.InventoryItem.list()
      ]);

      const products = productsResult.data || [];
      const inventory = inventoryResult.data || [];

      const analytics = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive).length,
        inactiveProducts: products.filter(p => !p.isActive).length,
        productsByCategory: {
          traditional: products.filter(p => p.category === 'traditional').length,
          modern: products.filter(p => p.category === 'modern').length,
          designer: products.filter(p => p.category === 'designer').length,
        },
        lowStockProducts: inventory.filter(inv => {
          const availableStock = (inv.stockQuantity || 0) - (inv.reservedQuantity || 0);
          const reorderPoint = inv.reorderPoint || 0;
          return availableStock <= reorderPoint;
        }).length,
        outOfStockProducts: inventory.filter(inv => {
          const availableStock = (inv.stockQuantity || 0) - (inv.reservedQuantity || 0);
          return availableStock <= 0;
        }).length,
        totalInventoryValue: products.reduce((total, product) => {
          const inv = inventory.find(i => i.productId === product.id);
          const availableStock = inv ? ((inv.stockQuantity || 0) - (inv.reservedQuantity || 0)) : 0;
          return total + (product.price * availableStock);
        }, 0),
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

  // Update product inventory
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

  // Get low stock alerts
  static async getLowStockAlerts() {
    try {
      const [productsResult, inventoryResult] = await Promise.all([
        client.models.Product.list({
          filter: { isActive: { eq: true } }
        }),
        client.models.InventoryItem.list()
      ]);

      const products = productsResult.data || [];
      const inventory = inventoryResult.data || [];

      const alerts = inventory
        .filter(inv => {
          const availableStock = (inv.stockQuantity || 0) - (inv.reservedQuantity || 0);
          return availableStock <= (inv.reorderPoint || 0);
        })
        .map(inv => {
          const product = products.find(p => p.id === inv.productId);
          const availableStock = (inv.stockQuantity || 0) - (inv.reservedQuantity || 0);
          
          return {
            productId: inv.productId,
            productName: product?.name || 'Unknown Product',
            currentStock: availableStock,
            reorderPoint: inv.reorderPoint || 0,
            alertType: availableStock <= 0 ? 'out_of_stock' : 'low_stock',
            product,
            inventory: inv,
          };
        });

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