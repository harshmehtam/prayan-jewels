import { cookiesClient } from '@/utils/amplify-utils';

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  addedAt: string;
}

// Generate a unique session ID for guest users
export function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get or create wishlist for a session
export async function getOrCreateWishlist(sessionId: string) {
  try {
    const client = await cookiesClient;
    
    // Try to find existing wishlist
    const wishlistResponse = await client.models.Wishlist.list({
      filter: { customerId: { eq: sessionId } },
      authMode: 'iam'
    });

    return wishlistResponse.data || [];
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return [];
  }
}

// Get wishlist items with product details
export async function getWishlistItems(sessionId: string): Promise<WishlistItem[]> {
  try {
    const wishlistItems = await getOrCreateWishlist(sessionId);
    
    if (wishlistItems.length === 0) return [];

    const client = await cookiesClient;
    const enrichedItems: WishlistItem[] = [];

    // Get product details for each item
    for (const item of wishlistItems) {
      const productResponse = await client.models.Product.get(
        { id: item.productId },
        { authMode: 'iam' }
      );

      if (productResponse.data) {
        enrichedItems.push({
          id: item.id,
          productId: item.productId,
          productName: productResponse.data.name,
          productPrice: productResponse.data.price,
          productImage: productResponse.data.images?.[0] || '',
          addedAt: item.createdAt
        });
      }
    }

    return enrichedItems;
  } catch (error) {
    console.error('Error loading wishlist items:', error);
    return [];
  }
}

// Add item to wishlist
export async function addToWishlist(
  sessionId: string,
  productId: string,
  productName: string,
  productPrice: number,
  productImage: string
) {
  try {
    const client = await cookiesClient;

    // Check if already exists
    const existingItems = await client.models.Wishlist.list({
      filter: {
        and: [
          { customerId: { eq: sessionId } },
          { productId: { eq: productId } }
        ]
      },
      authMode: 'iam'
    });

    if (existingItems.data && existingItems.data.length > 0) {
      return { success: false, error: 'Item already in wishlist' };
    }

    // Add to wishlist
    await client.models.Wishlist.create({
      customerId: sessionId,
      productId
    }, {
      authMode: 'iam'
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to wishlist'
    };
  }
}

// Remove item from wishlist
export async function removeFromWishlist(sessionId: string, productId: string) {
  try {
    const client = await cookiesClient;

    // Find the item
    const existingItems = await client.models.Wishlist.list({
      filter: {
        and: [
          { customerId: { eq: sessionId } },
          { productId: { eq: productId } }
        ]
      },
      authMode: 'iam'
    });

    if (!existingItems.data || existingItems.data.length === 0) {
      return { success: false, error: 'Item not found in wishlist' };
    }

    // Delete the item
    await client.models.Wishlist.delete(
      { id: existingItems.data[0].id },
      { authMode: 'iam' }
    );

    return { success: true };
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove from wishlist'
    };
  }
}

// Check if item is in wishlist
export async function isInWishlist(sessionId: string, productId: string): Promise<boolean> {
  try {
    const client = await cookiesClient;
    
    const result = await client.models.Wishlist.list({
      filter: {
        and: [
          { customerId: { eq: sessionId } },
          { productId: { eq: productId } }
        ]
      },
      authMode: 'iam'
    });

    return !!(result.data && result.data.length > 0);
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return false;
  }
}

// Batch check multiple products
export async function batchCheckWishlist(sessionId: string, productIds: string[]): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};

  try {
    const client = await cookiesClient;
    
    // Get all wishlist items for this session
    const wishlistResult = await client.models.Wishlist.list({
      filter: { customerId: { eq: sessionId } },
      authMode: 'iam'
    });

    const wishlistProductIds = new Set(
      wishlistResult.data?.map(item => item.productId) || []
    );

    // Check each product
    productIds.forEach(productId => {
      result[productId] = wishlistProductIds.has(productId);
    });

    return result;
  } catch (error) {
    console.error('Error batch checking wishlist:', error);
    productIds.forEach(productId => {
      result[productId] = false;
    });
    return result;
  }
}

// Get wishlist count
export async function getWishlistCount(sessionId: string): Promise<number> {
  try {
    const items = await getOrCreateWishlist(sessionId);
    return items.length;
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    return 0;
  }
}

// Clear all wishlist items
export async function clearWishlist(sessionId: string) {
  try {
    const client = await cookiesClient;

    // Get all items
    const items = await getOrCreateWishlist(sessionId);

    // Delete all items
    for (const item of items) {
      await client.models.Wishlist.delete(
        { id: item.id },
        { authMode: 'iam' }
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear wishlist'
    };
  }
}