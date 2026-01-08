'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistService, type WishlistItem } from '@/lib/services/wishlist-service';
import { useAuth } from '@/components/providers/auth-provider';
import { ProductService } from '@/lib/services/product-service';

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  wishlistStatus: Record<string, boolean>;
  loading: boolean;
  addToWishlist: (productId: string, productDetails?: { name: string; price: number; image: string }) => Promise<{ success: boolean; message: string }>;
  removeFromWishlist: (productId: string) => Promise<{ success: boolean; message: string }>;
  toggleWishlist: (productId: string, productDetails?: { name: string; price: number; image: string }) => Promise<{ success: boolean; message: string; isInWishlist: boolean }>;
  isInWishlist: (productId: string) => boolean; // Changed to synchronous
  batchCheckWishlist: (productIds: string[]) => Promise<Record<string, boolean>>;
  clearWishlist: () => Promise<{ success: boolean; message: string }>;
  refreshWishlist: () => Promise<void>;
  loadFullWishlistDetails: () => Promise<void>; // New method for loading full details
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userProfile } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistStatus, setWishlistStatus] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  const customerId = userProfile?.userId;

  // Load wishlist items - only called once on mount or auth change
  const loadWishlist = useCallback(async () => {
    if (loading || initialized) return; // Prevent multiple calls
    
    try {
      setLoading(true);
      let items: WishlistItem[] = [];

      if (isAuthenticated && customerId) {
        // Use lightweight version for initial load to avoid duplicate Product.list calls
        const lightweightItems = await WishlistService.getAuthenticatedWishlistLightweight(customerId);
        
        // Convert to WishlistItem format with minimal data
        items = lightweightItems.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: '', // Will be populated when needed
          productPrice: 0, // Will be populated when needed
          productImage: '', // Will be populated when needed
          addedAt: item.addedAt
        }));
      } else {
        items = WishlistService.getGuestWishlist();
      }

      setWishlistItems(items);
      setWishlistCount(items.length);
      
      // Update wishlist status for loaded items
      const status: Record<string, boolean> = {};
      items.forEach(item => {
        status[item.productId] = true;
      });
      setWishlistStatus(status); // Replace instead of merge to avoid stale data
      setInitialized(true);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlistItems([]);
      setWishlistCount(0);
      setWishlistStatus({});
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, customerId, loading, initialized]);

  // Batch check wishlist status for multiple products - only if not already loaded
  const batchCheckWishlist = useCallback(async (productIds: string[]): Promise<Record<string, boolean>> => {
    // If we already have the wishlist loaded, just return the status for these products
    if (initialized) {
      const result: Record<string, boolean> = {};
      productIds.forEach(productId => {
        result[productId] = wishlistStatus[productId] || false;
      });
      return result;
    }

    // If not initialized, load the wishlist first
    if (!loading) {
      await loadWishlist();
    }

    // Return the status after loading
    const result: Record<string, boolean> = {};
    productIds.forEach(productId => {
      result[productId] = wishlistStatus[productId] || false;
    });
    return result;
  }, [customerId, initialized, wishlistStatus, loadWishlist, loading]);

  // Load wishlist on mount and when auth state changes
  useEffect(() => {
    if (!initialized) {
      loadWishlist();
    }
  }, [loadWishlist, initialized]);

  // Reset when auth state changes
  useEffect(() => {
    setInitialized(false);
    setWishlistStatus({});
  }, [isAuthenticated, customerId]);

  // Migrate guest wishlist when user logs in
  useEffect(() => {
    const migrateWishlist = async () => {
      if (isAuthenticated && customerId && initialized) {
        const guestItems = WishlistService.getGuestWishlist();
        if (guestItems.length > 0) {
          console.log('Migrating guest wishlist...');
          const result = await WishlistService.migrateGuestWishlist(customerId);
          console.log(`Wishlist migration: ${result.migrated} migrated, ${result.failed} failed`);
          
          // Reload wishlist after migration
          setInitialized(false);
          await loadWishlist();
        }
      }
    };

    migrateWishlist();
  }, [isAuthenticated, customerId, initialized, loadWishlist]);

  // Add item to wishlist
  const addToWishlist = useCallback(async (productId: string, productDetails?: { name: string; price: number; image: string }): Promise<{ success: boolean; message: string }> => {
    try {
      // Check if already in wishlist using cached status
      if (wishlistStatus[productId]) {
        return { success: false, message: 'Item already in wishlist' };
      }

      let success = false;

      if (isAuthenticated && customerId) {
        // Add to authenticated wishlist directly (no existence check)
        success = await WishlistService.addToAuthenticatedWishlistDirect(customerId, productId);
      } else {
        // Add to guest wishlist - use provided product details or fetch if not provided
        if (productDetails) {
          success = WishlistService.addToGuestWishlist({
            productId: productId,
            productName: productDetails.name,
            productPrice: productDetails.price,
            productImage: productDetails.image
          });
        } else {
          // This should rarely happen if components pass product details correctly
          console.warn('Product details not provided for guest wishlist - this may cause unnecessary API calls');
          const product = await ProductService.getProductById(productId);
          if (product) {
            success = WishlistService.addToGuestWishlist({
              productId: product.id,
              productName: product.name,
              productPrice: product.price,
              productImage: product.images[0] || ''
            });
          }
        }
      }

      if (success) {
        // Update local state immediately - no need to reload entire wishlist
        setWishlistStatus(prev => ({ ...prev, [productId]: true }));
        setWishlistCount(prev => prev + 1);
        
        // Add to local wishlist items if we have product details
        if (productDetails) {
          const newItem: WishlistItem = {
            id: `temp_${Date.now()}`, // Temporary ID
            productId: productId,
            productName: productDetails.name,
            productPrice: productDetails.price,
            productImage: productDetails.image,
            addedAt: new Date().toISOString()
          };
          setWishlistItems(prev => [...prev, newItem]);
        }
        
        return { 
          success: true, 
          message: isAuthenticated ? 'Added to wishlist!' : 'Added to wishlist! Sign in to save across devices.' 
        };
      } else {
        return { success: false, message: 'Failed to add to wishlist' };
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, message: 'Failed to add to wishlist' };
    }
  }, [isAuthenticated, customerId, wishlistStatus]);

  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (productId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Check if not in wishlist using cached status
      if (!wishlistStatus[productId]) {
        return { success: false, message: 'Item not found in wishlist' };
      }

      let success = false;

      if (isAuthenticated && customerId) {
        // Find the wishlist item ID from our cached items
        const wishlistItem = wishlistItems.find(item => item.productId === productId);
        if (wishlistItem) {
          success = await WishlistService.removeFromAuthenticatedWishlistDirect(wishlistItem.id);
        } else {
          // Fallback: use the old method if we don't have the item cached
          success = await WishlistService.removeFromAuthenticatedWishlist(customerId, productId);
        }
      } else {
        success = WishlistService.removeFromGuestWishlist(productId);
      }

      if (success) {
        // Update local state immediately - no need to reload entire wishlist
        setWishlistStatus(prev => ({ ...prev, [productId]: false }));
        setWishlistCount(prev => Math.max(0, prev - 1));
        
        // Remove from local wishlist items
        setWishlistItems(prev => prev.filter(item => item.productId !== productId));
        
        return { success: true, message: 'Removed from wishlist' };
      } else {
        return { success: false, message: 'Failed to remove from wishlist' };
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, message: 'Failed to remove from wishlist' };
    }
  }, [isAuthenticated, customerId, wishlistStatus, wishlistItems]);

  // Toggle item in wishlist
  const toggleWishlist = useCallback(async (productId: string, productDetails?: { name: string; price: number; image: string }): Promise<{ success: boolean; message: string; isInWishlist: boolean }> => {
    const isCurrentlyInWishlist = wishlistStatus[productId] || false;
    
    if (isCurrentlyInWishlist) {
      const result = await removeFromWishlist(productId);
      return { ...result, isInWishlist: false };
    } else {
      const result = await addToWishlist(productId, productDetails);
      return { ...result, isInWishlist: true };
    }
  }, [wishlistStatus, addToWishlist, removeFromWishlist]);

  // Check if item is in wishlist (synchronous - uses cached status)
  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistStatus[productId] || false;
  }, [wishlistStatus]);

  // Clear entire wishlist
  const clearWishlist = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      let success = false;

      if (isAuthenticated && customerId) {
        success = await WishlistService.clearAuthenticatedWishlist(customerId);
      } else {
        success = WishlistService.clearGuestWishlist();
      }

      if (success) {
        // Clear local state
        setWishlistStatus({});
        setWishlistCount(0);
        setInitialized(false);
        
        await loadWishlist(); // Refresh wishlist
        return { success: true, message: 'Wishlist cleared' };
      } else {
        return { success: false, message: 'Failed to clear wishlist' };
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return { success: false, message: 'Failed to clear wishlist' };
    }
  }, [isAuthenticated, customerId, loadWishlist]);

  // Load full wishlist details (for wishlist page)
  const loadFullWishlistDetails = useCallback(async () => {
    if (!isAuthenticated || !customerId) return;
    
    try {
      setLoading(true);
      const items = await WishlistService.getAuthenticatedWishlist(customerId);
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading full wishlist details:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, customerId]);

  const value: WishlistContextType = {
    wishlistItems,
    wishlistCount,
    wishlistStatus,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    batchCheckWishlist,
    clearWishlist,
    refreshWishlist: loadWishlist,
    loadFullWishlistDetails
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}