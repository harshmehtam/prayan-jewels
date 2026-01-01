// Wishlist data access layer
import { client, handleAmplifyError } from '@/lib/amplify-client';
import type { WishlistItem } from '@/types';

export class WishlistService {
  // Get user's wishlist
  static async getUserWishlist(customerId: string) {
    try {
      const response = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      return {
        items: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Add product to wishlist
  static async addToWishlist(customerId: string, productId: string) {
    try {
      // Check if item already exists in wishlist
      const existingResponse = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId },
          productId: { eq: productId }
        }
      });

      if (existingResponse.data && existingResponse.data.length > 0) {
        return {
          item: existingResponse.data[0],
          errors: null,
          alreadyExists: true
        };
      }

      // Add new item to wishlist
      const response = await client.models.Wishlist.create({
        customerId,
        productId
      });

      return {
        item: response.data,
        errors: response.errors,
        alreadyExists: false
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Remove product from wishlist
  static async removeFromWishlist(customerId: string, productId: string) {
    try {
      // Find the wishlist item
      const existingResponse = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId },
          productId: { eq: productId }
        }
      });

      if (!existingResponse.data || existingResponse.data.length === 0) {
        return {
          success: false,
          error: 'Item not found in wishlist'
        };
      }

      // Delete the wishlist item
      const response = await client.models.Wishlist.delete({
        id: existingResponse.data[0].id
      });

      return {
        success: !!response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Remove wishlist item by ID
  static async removeWishlistItem(itemId: string) {
    try {
      const response = await client.models.Wishlist.delete({
        id: itemId
      });

      return {
        success: !!response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Check if product is in user's wishlist
  static async isInWishlist(customerId: string, productId: string) {
    try {
      const response = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId },
          productId: { eq: productId }
        }
      });

      return {
        isInWishlist: response.data && response.data.length > 0,
        item: response.data?.[0] || null,
        errors: response.errors
      };
    } catch (error) {
      return {
        isInWishlist: false,
        item: null,
        errors: [error]
      };
    }
  }

  // Get wishlist with product details
  static async getWishlistWithProducts(customerId: string) {
    try {
      const response = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      // Get product details for each wishlist item
      const itemsWithProducts = await Promise.all(
        (response.data || []).map(async (item) => {
          try {
            const productResponse = await client.models.Product.get({
              id: item.productId
            });
            
            return {
              ...item,
              product: productResponse.data
            };
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
            return {
              ...item,
              product: null
            };
          }
        })
      );

      return {
        items: itemsWithProducts,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Clear entire wishlist for user
  static async clearWishlist(customerId: string) {
    try {
      const response = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      if (!response.data || response.data.length === 0) {
        return {
          success: true,
          deletedCount: 0
        };
      }

      // Delete all wishlist items
      const deletePromises = response.data.map(item =>
        client.models.Wishlist.delete({ id: item.id })
      );

      const deleteResults = await Promise.all(deletePromises);
      const successCount = deleteResults.filter(result => result.data).length;

      return {
        success: successCount === response.data.length,
        deletedCount: successCount,
        totalCount: response.data.length
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get wishlist count for user
  static async getWishlistCount(customerId: string) {
    try {
      const response = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      return {
        count: response.data?.length || 0,
        errors: response.errors
      };
    } catch (error) {
      return {
        count: 0,
        errors: [error]
      };
    }
  }
}