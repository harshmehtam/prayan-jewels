import { cookiesClient } from '@/utils/amplify-utils';

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  addedAt: string;
}

const GUEST_WISHLIST_KEY = 'guest_wishlist';
const CACHE_DURATION = 30000; // 30 seconds

// Cache for wishlist status to avoid repeated API calls
const wishlistCache = new Map<string, { status: boolean; timestamp: number }>();

// Get wishlist for authenticated user
export const getAuthenticatedWishlistLightweight = async (customerId: string): Promise<{ productId: string; id: string; addedAt: string }[]> => {
  try {
    const client = await cookiesClient;
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
};

// Get wishlist for authenticated
export const getAuthenticatedWishlist = async (customerId: string): Promise<WishlistItem[]> => {
  try {
    const client = await cookiesClient;
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
};

// Get wishlist for guest user from localStorage
export const getGuestWishlist = (): WishlistItem[] => {
  try {
    const stored = localStorage.getItem(GUEST_WISHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading guest wishlist:', error);
    return [];
  }
};

// Add item to authenticated user's wishlist
export const addToAuthenticatedWishlistDirect = async (customerId: string, productId: string): Promise<boolean> => {
  try {
    const client = await cookiesClient;
    const result = await client.models.Wishlist.create({
      customerId,
      productId
    });

    // Clear cache for this user
    clearCache(customerId);

    return !!result.data;
  } catch (error) {
    console.error('Error adding to authenticated wishlist:', error);
    return false;
  }
};

// Add item to authenticated user's wishlist
export const addToAuthenticatedWishlist = async (customerId: string, productId: string): Promise<boolean> => {
  try {
    const client = await cookiesClient;
    // Check if already exists
    const existing = await client.models.Wishlist.list({
      filter: { 
        customerId: { eq: customerId },
        productId: { eq: productId }
      }
    });

    if (existing.data && existing.data.length > 0) {
      return false;
    }

    // Add to wishlist
    const result = await client.models.Wishlist.create({
      customerId,
      productId
    });

    // Clear cache for this user
    clearCache(customerId);

    return !!result.data;
  } catch (error) {
    console.error('Error adding to authenticated wishlist:', error);
    return false;
  }
};

// Add item to guest wishlist (localStorage)
export const addToGuestWishlist = (item: Omit<WishlistItem, 'id' | 'addedAt'>): boolean => {
  try {
    const wishlist = getGuestWishlist();
    
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
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
    
    // Clear guest cache
    clearCache();
    
    return true;
  } catch (error) {
    console.error('Error adding to guest wishlist:', error);
    return false;
  }
};

// Remove item from authenticated user's wishlist
export const removeFromAuthenticatedWishlistDirect = async (wishlistItemId: string): Promise<boolean> => {
  try {
    const client = await cookiesClient;
    const result = await client.models.Wishlist.delete({
      id: wishlistItemId
    });

    return !!result.data;
  } catch (error) {
    console.error('Error removing from authenticated wishlist:', error);
    return false;
  }
};

// Remove item from authenticated user's wishlist (with lookup - for backward compatibility)
export const removeFromAuthenticatedWishlist = async (customerId: string, productId: string): Promise<boolean> => {
  try {
    const client = await cookiesClient;
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
    clearCache(customerId);

    return !!result.data;
  } catch (error) {
    console.error('Error removing from authenticated wishlist:', error);
    return false;
  }
};

// Remove item from guest wishlist
export const removeFromGuestWishlist = (productId: string): boolean => {
  try {
    const wishlist = getGuestWishlist();
    const filtered = wishlist.filter(item => item.productId !== productId);
    
    if (filtered.length === wishlist.length) {
      return false; // Item not found
    }

    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(filtered));
    
    // Clear guest cache
    clearCache();
    
    return true;
  } catch (error) {
    console.error('Error removing from guest wishlist:', error);
    return false;
  }
};

// Check if item is in wishlist (works for both authenticated and guest)
export const isInWishlist = async (productId: string, customerId?: string): Promise<boolean> => {
  const cacheKey = `${customerId || 'guest'}_${productId}`;
  const cached = wishlistCache.get(cacheKey);
  
  // Return cached result if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.status;
  }

  let isInWishlistResult = false;

  if (customerId) {
    // Check authenticated wishlist
    try {
      const client = await cookiesClient;
      const result = await client.models.Wishlist.list({
        filter: { 
          customerId: { eq: customerId },
          productId: { eq: productId }
        }
      });
      isInWishlistResult = !!(result.data && result.data.length > 0);
    } catch (error) {
      console.error('Error checking authenticated wishlist:', error);
      isInWishlistResult = false;
    }
  } else {
    // Check guest wishlist
    const guestWishlist = getGuestWishlist();
    isInWishlistResult = guestWishlist.some(item => item.productId === productId);
  }

  // Cache the result
  wishlistCache.set(cacheKey, { status: isInWishlistResult, timestamp: Date.now() });
  return isInWishlistResult;
};

// Batch check multiple products at once (for authenticated users)
export const batchCheckWishlist = async (productIds: string[], customerId?: string): Promise<Record<string, boolean>> => {
  const result: Record<string, boolean> = {};

  if (!customerId) {
    // For guest users, check localStorage
    const guestWishlist = getGuestWishlist();
    const guestProductIds = new Set(guestWishlist.map(item => item.productId));
    
    productIds.forEach(productId => {
      result[productId] = guestProductIds.has(productId);
      // Cache the results
      const cacheKey = `guest_${productId}`;
      wishlistCache.set(cacheKey, { status: result[productId], timestamp: Date.now() });
    });
    
    return result;
  }

  try {
    const client = await cookiesClient;
    // Single API call to get all wishlist items for the user
    const wishlistResult = await client.models.Wishlist.list({
      filter: { customerId: { eq: customerId } }
    });

    const wishlistProductIds = new Set(
      wishlistResult.data?.map(item => item.productId) || []
    );

    // Check each product and cache results
    productIds.forEach(productId => {
      const isInWishlistStatus = wishlistProductIds.has(productId);
      result[productId] = isInWishlistStatus;
      
      // Cache the result
      const cacheKey = `${customerId}_${productId}`;
      wishlistCache.set(cacheKey, { status: isInWishlistStatus, timestamp: Date.now() });
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
};

// Clear cache when wishlist is modified
export const clearCache = (customerId?: string): void => {
  if (customerId) {
    // Clear cache for specific user
    for (const [key] of wishlistCache) {
      if (key.startsWith(`${customerId}_`)) {
        wishlistCache.delete(key);
      }
    }
  } else {
    // Clear guest cache
    for (const [key] of wishlistCache) {
      if (key.startsWith('guest_')) {
        wishlistCache.delete(key);
      }
    }
  }
};

// Migrate guest wishlist to authenticated user (called after login)
export const migrateGuestWishlist = async (customerId: string): Promise<{ migrated: number; failed: number }> => {
  const guestWishlist = getGuestWishlist();
  
  try {
    if (guestWishlist.length === 0) {
      return { migrated: 0, failed: 0 };
    }

    let migrated = 0;
    let failed = 0;

    // Add each guest item to authenticated wishlist
    for (const item of guestWishlist) {
      const success = await addToAuthenticatedWishlist(customerId, item.productId);
      if (success) {
        migrated++;
      } else {
        failed++;
      }
    }

    // Clear guest wishlist after migration
    localStorage.removeItem(GUEST_WISHLIST_KEY);

    return { migrated, failed };
  } catch (error) {
    console.error('Error migrating guest wishlist:', error);
    return { migrated: 0, failed: guestWishlist.length };
  }
};

// Get wishlist count (for header badge)
export const getWishlistCount = async (customerId?: string): Promise<number> => {
  if (customerId) {
    try {
      const client = await cookiesClient;
      const result = await client.models.Wishlist.list({
        filter: { customerId: { eq: customerId } }
      });
      return result.data?.length || 0;
    } catch (error) {
      console.error('Error getting authenticated wishlist count:', error);
      return 0;
    }
  } else {
    const guestWishlist = getGuestWishlist();
    return guestWishlist.length;
  }
};

// Clear all wishlist items (for authenticated users)
export const clearAuthenticatedWishlist = async (customerId: string): Promise<boolean> => {
  try {
    const client = await cookiesClient;
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
};

// Clear guest wishlist
export const clearGuestWishlist = (): boolean => {
  try {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing guest wishlist:', error);
    return false;
  }
};