'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { Product } from '@/types';
import { useAuth } from '@/components/providers/auth-provider';

const client = generateClient<Schema>();

const GUEST_WISHLIST_KEY = 'guest_wishlist';

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  wishlistStatus: Record<string, boolean>;
  loading: boolean;
  addToWishlist: (productId: string, productDetails?: { name: string; price: number; image: string }) => Promise<{ success: boolean; message: string }>;
  removeFromWishlist: (productId: string) => Promise<{ success: boolean; message: string }>;
  toggleWishlist: (productId: string, productDetails?: { name: string; price: number; image: string }) => Promise<{ success: boolean; message: string; isInWishlist: boolean }>;
  isInWishlist: (productId: string) => boolean;
  batchCheckWishlist: (productIds: string[]) => Promise<Record<string, boolean>>;
  clearWishlist: () => Promise<{ success: boolean; message: string }>;
  refreshWishlist: () => Promise<void>;
  loadFullWishlistDetails: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Guest wishlist helpers
const getGuestWishlist = (): WishlistItem[] => {
  try {
    const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading guest wishlist:', error);
    return [];
  }
};

const addToGuestWishlist = (item: Omit<WishlistItem, 'id' | 'addedAt'>): boolean => {
  try {
    const wishlist = getGuestWishlist();
    
    if (wishlist.some(w => w.productId === item.productId)) {
      return false;
    }

    const newItem: WishlistItem = {
      ...item,
      id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      addedAt: new Date().toISOString()
    };

    wishlist.push(newItem);
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
    return true;
  } catch (error) {
    console.error('Error adding to guest wishlist:', error);
    return false;
  }
};

const removeFromGuestWishlist = (productId: string): boolean => {
  try {
    const wishlist = getGuestWishlist();
    const filtered = wishlist.filter(item => item.productId !== productId);
    
    if (filtered.length === wishlist.length) {
      return false;
    }

    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing from guest wishlist:', error);
    return false;
  }
};

const clearGuestWishlist = (): boolean => {
  try {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing guest wishlist:', error);
    return false;
  }
};

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userProfile } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistStatus, setWishlistStatus] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  const customerId = userProfile?.userId;

  // Load wishlist items - lightweight version
  const loadWishlist = useCallback(async () => {
    if (loading || initialized) return;

    try {
      setLoading(true);
      let items: WishlistItem[] = [];

      if (isAuthenticated && customerId) {
        // Fetch wishlist items from database
        const wishlistResult = await client.models.Wishlist.list({
          filter: { customerId: { eq: customerId } }
        });

        if (wishlistResult.data && wishlistResult.data.length > 0) {
          items = wishlistResult.data.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: '',
            productPrice: 0,
            productImage: '',
            addedAt: item.createdAt
          }));
        }
      } else {
        items = getGuestWishlist();
      }

      setWishlistItems(items);
      setWishlistCount(items.length);

      const status: Record<string, boolean> = {};
      items.forEach(item => {
        status[item.productId] = true;
      });
      setWishlistStatus(status);
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

  // Batch check wishlist status
  const batchCheckWishlist = useCallback(async (productIds: string[]): Promise<Record<string, boolean>> => {
    if (initialized) {
      const result: Record<string, boolean> = {};
      productIds.forEach(productId => {
        result[productId] = wishlistStatus[productId] || false;
      });
      return result;
    }

    if (!loading) {
      await loadWishlist();
    }

    const result: Record<string, boolean> = {};
    productIds.forEach(productId => {
      result[productId] = wishlistStatus[productId] || false;
    });
    return result;
  }, [initialized, wishlistStatus, loadWishlist, loading]);

  // Load wishlist on mount
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
        const guestItems = getGuestWishlist();
        if (guestItems.length > 0) {
          let migrated = 0;
          let failed = 0;

          for (const item of guestItems) {
            try {
              // Check if already exists
              const existing = await client.models.Wishlist.list({
                filter: { 
                  customerId: { eq: customerId },
                  productId: { eq: item.productId }
                }
              });

              if (!existing.data || existing.data.length === 0) {
                const result = await client.models.Wishlist.create({
                  customerId,
                  productId: item.productId
                });

                if (result.data) {
                  migrated++;
                } else {
                  failed++;
                }
              }
            } catch (error) {
              failed++;
            }
          }

          localStorage.removeItem(GUEST_WISHLIST_KEY);

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
      if (wishlistStatus[productId]) {
        return { success: false, message: 'Item already in wishlist' };
      }

      let success = false;

      if (isAuthenticated && customerId) {
        const result = await client.models.Wishlist.create({
          customerId,
          productId
        });
        success = !!result.data;
      } else {
        if (productDetails) {
          success = addToGuestWishlist({
            productId: productId,
            productName: productDetails.name,
            productPrice: productDetails.price,
            productImage: productDetails.image
          });
        } else {
          try {
            const productResponse = await client.models.Product.get({ id: productId });
            
            if (productResponse.data) {
              success = addToGuestWishlist({
                productId: productResponse.data.id,
                productName: productResponse.data.name,
                productPrice: productResponse.data.price,
                productImage: productResponse.data.images?.[0] || ''
              });
            }
          } catch (error) {
            console.error('Error fetching product details:', error);
            return { success: false, message: 'Failed to fetch product details' };
          }
        }
      }

      if (success) {
        setWishlistStatus(prev => ({ ...prev, [productId]: true }));
        setWishlistCount(prev => prev + 1);

        if (productDetails) {
          const newItem: WishlistItem = {
            id: `temp_${Date.now()}`,
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
      if (!wishlistStatus[productId]) {
        return { success: false, message: 'Item not found in wishlist' };
      }

      let success = false;

      if (isAuthenticated && customerId) {
        const wishlistItem = wishlistItems.find(item => item.productId === productId);
        
        if (wishlistItem && wishlistItem.id && !wishlistItem.id.startsWith('temp_')) {
          const result = await client.models.Wishlist.delete({ id: wishlistItem.id });
          success = !!result.data;
        } else {
          const existing = await client.models.Wishlist.list({
            filter: { 
              customerId: { eq: customerId },
              productId: { eq: productId }
            }
          });

          if (existing.data && existing.data.length > 0) {
            const result = await client.models.Wishlist.delete({ id: existing.data[0].id });
            success = !!result.data;
          }
        }
      } else {
        success = removeFromGuestWishlist(productId);
      }

      if (success) {
        setWishlistStatus(prev => ({ ...prev, [productId]: false }));
        setWishlistCount(prev => Math.max(0, prev - 1));
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

  // Check if item is in wishlist
  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistStatus[productId] || false;
  }, [wishlistStatus]);

  // Clear entire wishlist
  const clearWishlist = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      let success = false;

      if (isAuthenticated && customerId) {
        const result = await client.models.Wishlist.list({
          filter: { customerId: { eq: customerId } }
        });

        if (result.data && result.data.length > 0) {
          const deletePromises = result.data.map(item => 
            client.models.Wishlist.delete({ id: item.id })
          );
          await Promise.all(deletePromises);
        }
        success = true;
      } else {
        success = clearGuestWishlist();
      }

      if (success) {
        setWishlistStatus({});
        setWishlistCount(0);
        setWishlistItems([]);
        setInitialized(false);

        await loadWishlist();
        return { success: true, message: 'Wishlist cleared' };
      } else {
        return { success: false, message: 'Failed to clear wishlist' };
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return { success: false, message: 'Failed to clear wishlist' };
    }
  }, [isAuthenticated, customerId, loadWishlist]);

  // Load full wishlist details with product information
  const loadFullWishlistDetails = useCallback(async () => {
    if (!isAuthenticated || !customerId) return;

    try {
      setLoading(true);
      
      const wishlistResult = await client.models.Wishlist.list({
        filter: { customerId: { eq: customerId } }
      });

      if (!wishlistResult.data || wishlistResult.data.length === 0) {
        setWishlistItems([]);
        return;
      }

      const productIds = [...new Set(wishlistResult.data.map(item => item.productId))];

      const productPromises = productIds.map(id => 
        client.models.Product.get({ id })
      );
      const productResponses = await Promise.all(productPromises);

      const productsMap = new Map<string, Product>();
      productResponses.forEach(response => {
        if (response.data) {
          productsMap.set(response.data.id, {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            price: response.data.price,
            actualPrice: response.data.actualPrice,
            images: response.data.images?.filter((img: string | null): img is string => img !== null) || [],
            isActive: response.data.isActive,
            viewCount: response.data.viewCount,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          } as Product);
        }
      });

      const items: WishlistItem[] = [];
      for (const item of wishlistResult.data) {
        const product = productsMap.get(item.productId);
        if (product) {
          items.push({
            id: item.id,
            productId: item.productId,
            productName: product.name,
            productPrice: product.price,
            productImage: product.images[0] || '',
            addedAt: item.createdAt
          });
        }
      }

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