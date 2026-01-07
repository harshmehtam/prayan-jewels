// Wishlist management hook
'use client';

import { useState, useEffect } from 'react';
import { WishlistService } from '@/lib/data/wishlist';
import type { WishlistItem } from '@/types';

export function useWishlist() {
  // Mock user for now - in real implementation, get from auth context
  const user = { userId: 'user-1' };
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wishlist items
  const loadWishlist = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await WishlistService.getUserWishlist(user.userId);
      
      if (result.errors && result.errors.length > 0) {
        setError(result.errors[0].message);
      } else {
        // Transform Amplify data to match our WishlistItem type
        const transformedItems: WishlistItem[] = await Promise.all(
          result.items.map(async (item: any) => {
            let product = null;
            try {
              // Fetch the product data if available
              if (item.product && typeof item.product === 'function') {
                const productResult = await item.product();
                product = productResult.data;
              }
            } catch (err) {
              console.warn('Failed to load product for wishlist item:', err);
            }

            return {
              id: item.id,
              customerId: item.customerId,
              productId: item.productId,
              product: product,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            };
          })
        );
        
        setWishlistItems(transformedItems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId: string) => {
    if (!user?.userId) {
      setError('Please log in to add items to your wishlist');
      return false;
    }

    try {
      setError(null);
      const result = await WishlistService.addToWishlist(user.userId, productId);

      if (result.errors && result.errors.length > 0) {
        setError(result.errors[0].message);
        return false;
      }

      // Reload wishlist to get updated data
      await loadWishlist();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to wishlist');
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (itemId: string) => {
    try {
      setError(null);
      
      // Find the item to get the productId
      const item = wishlistItems.find(item => item.id === itemId);
      if (!item) {
        setError('Item not found in wishlist');
        return false;
      }
      
      const result = await WishlistService.removeFromWishlist(user.userId, item.productId);

      if (result.errors && result.errors.length > 0) {
        setError(result.errors[0].message);
        return false;
      }

      // Remove item from local state immediately for better UX
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item from wishlist');
      return false;
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  // Get wishlist item for a product
  const getWishlistItem = (productId: string) => {
    return wishlistItems.find(item => item.productId === productId);
  };

  // Toggle wishlist status for a product
  const toggleWishlist = async (productId: string) => {
    const wishlistItem = getWishlistItem(productId);
    
    if (wishlistItem) {
      return await removeFromWishlist(wishlistItem.id);
    } else {
      return await addToWishlist(productId);
    }
  };

  // Load wishlist on mount and when user changes
  useEffect(() => {
    if (user?.userId) {
      loadWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user?.userId]);

  return {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistItem,
    toggleWishlist,
    loadWishlist,
    wishlistCount: wishlistItems.length
  };
}