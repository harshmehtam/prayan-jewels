// Wishlist data access layer
import { client, handleAmplifyError } from '@/lib/amplify-client';
import type { WishlistItem, CreateWishlistItemInput } from '@/types';

export class WishlistService {
  // Get user's wishlist items
  static async getWishlistItems(customerId: string) {
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

  // Add item to wishlist
  static async addToWishlist(input: CreateWishlistItemInput) {
    try {
      // Check if item already exists in wishlist
      const existingResponse = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: input.customerId },
          productId: { eq: input.productId }
        }
      });

      if (existingResponse.data && existingResponse.data.length > 0) {
        throw new Error('Product is already in your wishlist');
      }

      const response = await client.models.Wishlist.create(input);

      return {
        item: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Remove item from wishlist
  static async removeFromWishlist(itemId: string) {
    try {
      const response = await client.models.Wishlist.delete({ id: itemId });

      return {
        success: true,
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
        wishlistItem: response.data?.[0] || null,
        errors: response.errors
      };
    } catch (error) {
      return {
        isInWishlist: false,
        wishlistItem: null,
        errors: [{ message: handleAmplifyError(error) }]
      };
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
        errors: [{ message: handleAmplifyError(error) }]
      };
    }
  }
}