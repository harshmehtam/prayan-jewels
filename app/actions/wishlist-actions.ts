'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import * as wishlistService from '@/lib/services/wishlist-service';

// Helper to get or create session ID
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('wishlist_session_id')?.value;
  
  if (!sessionId) {
    sessionId = wishlistService.generateSessionId();
    cookieStore.set('wishlist_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  
  return sessionId;
}

// Get wishlist items
export async function getWishlist() {
  try {
    const sessionId = await getSessionId();
    return await wishlistService.getWishlistItems(sessionId);
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return [];
  }
}

// Get wishlist count
export async function getWishlistCount(): Promise<number> {
  try {
    const sessionId = await getSessionId();
    return await wishlistService.getWishlistCount(sessionId);
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    return 0;
  }
}

// Add item to wishlist
export async function addToWishlist(
  productId: string,
  productName: string,
  productPrice: number,
  productImage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = await getSessionId();
    const result = await wishlistService.addToWishlist(sessionId, productId, productName, productPrice, productImage);
    
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/account/wishlist');
    }
    
    return result;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to wishlist'
    };
  }
}

// Remove item from wishlist
export async function removeFromWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = await getSessionId();
    const result = await wishlistService.removeFromWishlist(sessionId, productId);
    
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/account/wishlist');
    }
    
    return result;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove from wishlist'
    };
  }
}

// Check if item is in wishlist
export async function isInWishlist(productId: string): Promise<boolean> {
  try {
    const sessionId = await getSessionId();
    return await wishlistService.isInWishlist(sessionId, productId);
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return false;
  }
}

// Batch check multiple products
export async function batchCheckWishlist(productIds: string[]): Promise<Record<string, boolean>> {
  try {
    const sessionId = await getSessionId();
    return await wishlistService.batchCheckWishlist(sessionId, productIds);
  } catch (error) {
    console.error('Error batch checking wishlist:', error);
    const result: Record<string, boolean> = {};
    productIds.forEach(id => result[id] = false);
    return result;
  }
}

// Clear wishlist
export async function clearWishlist(): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = await getSessionId();
    const result = await wishlistService.clearWishlist(sessionId);
    
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/account/wishlist');
    }
    
    return result;
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear wishlist'
    };
  }
}
