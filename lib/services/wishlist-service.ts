// Wishlist service supporting both authenticated and guest users
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  addedAt: string;
}

export class WishlistService {
  private static readonly GUEST_WISHLIST_KEY = 'guest_wishlist';

  // Get wishlist for authenticated user from database (lightweight - no product details)
  static async getAuthenticatedWishlistLightweight(customerId: string): Promise<{ productId: string; id: string; addedAt: string }[]> {
    try {
      // Just get wishlist items without product details for better performance
      const wishlistResult = await client.models.Wishlist.list({
        filter: { customerId: { eq: customerId } }
      });

      if (!wishlistResult.data || wishlistResult.data.length === 0) return [];

      // Return lightweight wishlist items
      return wishlistResult.data.map(item => ({
        id: item.id,
        productId: item.productId,
        addedAt: item.createdAt
      }));
    } catch (error) {
      console.error('Error fetching authenticated wishlist (lightweight):', error);
      return [];
    }
  }

  // Get wishlist for authenticated user from database (with product details - for wishlist page)
  static async getAuthenticatedWishlist(customerId: string): Promise<WishlistItem[]> {
    try {
      // First, get the wishlist items
      const wishlistResult = await client.models.Wishlist.list({
        filter: { customerId: { eq: customerId } }
      });

      if (!wishlistResult.data || wishlistResult.data.length === 0) return [];

      // Extract unique product IDs
      const productIds = [...new Set(wishlistResult.data.map(item => item.productId))];

      // Batch fetch all products in one query using filter
      const productsResult = await client.models.Product.list({
        filter: {
          or: productIds.map(id => ({ id: { eq: id } }))
        }
      });

      // Create a map of products for quick lookup
      const productsMap = new Map();
      if (productsResult.data) {
        productsResult.data.forEach(product => {
          productsMap.set(product.id, product);
        });
      }

      // Transform to our interface using the products map
      const wishlistItems: WishlistItem[] = [];
      for (const item of wishlistResult.data) {
        const product = productsMap.get(item.productId);
        if (product) {
          wishlistItems.push({
            id: item.id,
            productId: item.productId,
            productName: product.name,
            productPrice: product.price,
            productImage: product.images?.[0] || '',
            addedAt: item.createdAt
          });
        }
      }

      return wishlistItems;
    } catch (error) {
      console.error('Error fetching authenticated wishlist:', error);
      return [];
    }
  }

  // Get wishlist for guest user from localStorage
  static getGuestWishlist(): WishlistItem[] {
    try {
      const stored = localStorage.getItem(this.GUEST_WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading guest wishlist:', error);
      return [];
    }
  }

  // Add item to authenticated user's wishlist (optimized - no existence check)
  static async addToAuthenticatedWishlistDirect(customerId: string, productId: string): Promise<boolean> {
    try {
      // Add to wishlist directly without checking existence (caller should check)
      const result = await client.models.Wishlist.create({
        customerId,
        productId
      });

      // Clear cache for this user
      this.clearCache(customerId);

      return !!result.data;
    } catch (error) {
      console.error('Error adding to authenticated wishlist:', error);
      return false;
    }
  }

  // Add item to authenticated user's wishlist (with existence check - for backward compatibility)
  static async addToAuthenticatedWishlist(customerId: string, productId: string): Promise<boolean> {
    try {
      // Check if already exists
      const existing = await client.models.Wishlist.list({
        filter: { 
          customerId: { eq: customerId },
          productId: { eq: productId }
        }
      });

      if (existing.data && existing.data.length > 0) {
        return false; // Already in wishlist
      }

      // Add to wishlist
      const result = await client.models.Wishlist.create({
        customerId,
        productId
      });

      // Clear cache for this user
      this.clearCache(customerId);

      return !!result.data;
    } catch (error) {
      console.error('Error adding to authenticated wishlist:', error);
      return false;
    }
  }

  // Add item to guest wishlist (localStorage)
  static addToGuestWishlist(item: Omit<WishlistItem, 'id' | 'addedAt'>): boolean {
    try {
      const wishlist = this.getGuestWishlist();
      
      // Check if already exists
      if (wishlist.some(w => w.productId === item.productId)) {
        return false; // Already in wishlist
      }

      // Add new item
      const newItem: WishlistItem = {
        ...item,
        id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        addedAt: new Date().toISOString()
      };

      wishlist.push(newItem);
      localStorage.setItem(this.GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
      
      // Clear guest cache
      this.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error adding to guest wishlist:', error);
      return false;
    }
  }

  // Remove item from authenticated user's wishlist (optimized - direct removal)
  static async removeFromAuthenticatedWishlistDirect(wishlistItemId: string): Promise<boolean> {
    try {
      // Remove from wishlist directly using the wishlist item ID
      const result = await client.models.Wishlist.delete({
        id: wishlistItemId
      });

      return !!result.data;
    } catch (error) {
      console.error('Error removing from authenticated wishlist:', error);
      return false;
    }
  }

  // Remove item from authenticated user's wishlist (with lookup - for backward compatibility)
  static async removeFromAuthenticatedWishlist(customerId: string, productId: string): Promise<boolean> {
    try {
      const existing = await client.models.Wishlist.list({
        filter: { 
          customerId: { eq: customerId },
          productId: { eq: productId }
        }
      });

      if (!existing.data || existing.data.length === 0) {
        return false; // Not in wishlist
      }

      // Remove from wishlist
      const result = await client.models.Wishlist.delete({
        id: existing.data[0].id
      });

      // Clear cache for this user
      this.clearCache(customerId);

      return !!result.data;
    } catch (error) {
      console.error('Error removing from authenticated wishlist:', error);
      return false;
    }
  }

  // Remove item from guest wishlist
  static removeFromGuestWishlist(productId: string): boolean {
    try {
      const wishlist = this.getGuestWishlist();
      const filtered = wishlist.filter(item => item.productId !== productId);
      
      if (filtered.length === wishlist.length) {
        return false; // Item not found
      }

      localStorage.setItem(this.GUEST_WISHLIST_KEY, JSON.stringify(filtered));
      
      // Clear guest cache
      this.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error removing from guest wishlist:', error);
      return false;
    }
  }

  // Cache for wishlist status to avoid repeated API calls
  private static wishlistCache = new Map<string, { status: boolean; timestamp: number }>();
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  // Check if item is in wishlist (works for both authenticated and guest)
  static async isInWishlist(productId: string, customerId?: string): Promise<boolean> {
    const cacheKey = `${customerId || 'guest'}_${productId}`;
    const cached = this.wishlistCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.status;
    }

    let isInWishlist = false;

    if (customerId) {
      // Check authenticated wishlist
      try {
        const result = await client.models.Wishlist.list({
          filter: { 
            customerId: { eq: customerId },
            productId: { eq: productId }
          }
        });
        isInWishlist = !!(result.data && result.data.length > 0);
      } catch (error) {
        console.error('Error checking authenticated wishlist:', error);
        isInWishlist = false;
      }
    } else {
      // Check guest wishlist
      const guestWishlist = this.getGuestWishlist();
      isInWishlist = guestWishlist.some(item => item.productId === productId);
    }

    // Cache the result
    this.wishlistCache.set(cacheKey, { status: isInWishlist, timestamp: Date.now() });
    return isInWishlist;
  }

  // Batch check multiple products at once (for authenticated users)
  static async batchCheckWishlist(productIds: string[], customerId?: string): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    if (!customerId) {
      // For guest users, check localStorage
      const guestWishlist = this.getGuestWishlist();
      const guestProductIds = new Set(guestWishlist.map(item => item.productId));
      
      productIds.forEach(productId => {
        result[productId] = guestProductIds.has(productId);
        // Cache the results
        const cacheKey = `guest_${productId}`;
        this.wishlistCache.set(cacheKey, { status: result[productId], timestamp: Date.now() });
      });
      
      return result;
    }

    try {
      // Single API call to get all wishlist items for the user
      const wishlistResult = await client.models.Wishlist.list({
        filter: { customerId: { eq: customerId } }
      });

      const wishlistProductIds = new Set(
        wishlistResult.data?.map(item => item.productId) || []
      );

      // Check each product and cache results
      productIds.forEach(productId => {
        const isInWishlist = wishlistProductIds.has(productId);
        result[productId] = isInWishlist;
        
        // Cache the result
        const cacheKey = `${customerId}_${productId}`;
        this.wishlistCache.set(cacheKey, { status: isInWishlist, timestamp: Date.now() });
      });

      return result;
    } catch (error) {
      console.error('Error batch checking wishlist:', error);
      // Return false for all products on error
      productIds.forEach(productId => {
        result[productId] = false;
      });
      return result;
    }
  }

  // Clear cache when wishlist is modified
  static clearCache(customerId?: string) {
    if (customerId) {
      // Clear cache for specific user
      for (const [key] of this.wishlistCache) {
        if (key.startsWith(`${customerId}_`)) {
          this.wishlistCache.delete(key);
        }
      }
    } else {
      // Clear guest cache
      for (const [key] of this.wishlistCache) {
        if (key.startsWith('guest_')) {
          this.wishlistCache.delete(key);
        }
      }
    }
  }

  // Migrate guest wishlist to authenticated user (called after login)
  static async migrateGuestWishlist(customerId: string): Promise<{ migrated: number; failed: number }> {
    const guestWishlist = this.getGuestWishlist();
    
    try {
      if (guestWishlist.length === 0) {
        return { migrated: 0, failed: 0 };
      }

      let migrated = 0;
      let failed = 0;

      // Add each guest item to authenticated wishlist
      for (const item of guestWishlist) {
        const success = await this.addToAuthenticatedWishlist(customerId, item.productId);
        if (success) {
          migrated++;
        } else {
          failed++;
        }
      }

      // Clear guest wishlist after migration
      localStorage.removeItem(this.GUEST_WISHLIST_KEY);

      return { migrated, failed };
    } catch (error) {
      console.error('Error migrating guest wishlist:', error);
      return { migrated: 0, failed: guestWishlist.length };
    }
  }

  // Get wishlist count (for header badge)
  static async getWishlistCount(customerId?: string): Promise<number> {
    if (customerId) {
      try {
        const result = await client.models.Wishlist.list({
          filter: { customerId: { eq: customerId } }
        });
        return result.data?.length || 0;
      } catch (error) {
        console.error('Error getting authenticated wishlist count:', error);
        return 0;
      }
    } else {
      const guestWishlist = this.getGuestWishlist();
      return guestWishlist.length;
    }
  }

  // Clear all wishlist items (for authenticated users)
  static async clearAuthenticatedWishlist(customerId: string): Promise<boolean> {
    try {
      const result = await client.models.Wishlist.list({
        filter: { customerId: { eq: customerId } }
      });

      if (!result.data || result.data.length === 0) {
        return true; // Already empty
      }

      // Delete all items
      const deletePromises = result.data.map(item => 
        client.models.Wishlist.delete({ id: item.id })
      );

      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error clearing authenticated wishlist:', error);
      return false;
    }
  }

  // Clear guest wishlist
  static clearGuestWishlist(): boolean {
    try {
      localStorage.removeItem(this.GUEST_WISHLIST_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing guest wishlist:', error);
      return false;
    }
  }
}