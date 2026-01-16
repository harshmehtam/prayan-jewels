'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import * as cartService from '@/lib/services/cart-service';

// Helper to get or create session ID
async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('cart_session_id')?.value;
  
  if (!sessionId) {
    sessionId = cartService.generateSessionId();
    cookieStore.set('cart_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  
  return sessionId;
}

// Get cart with items
export async function getCart() {
  try {
    const sessionId = await getSessionId();
    return await cartService.getCartWithItems(sessionId);
  } catch (error) {
    console.error('Error getting cart:', error);
    return null;
  }
}

// Get cart item count
export async function getCartItemCount(): Promise<number> {
  try {
    const sessionId = await getSessionId();
    return await cartService.getCartItemCount(sessionId);
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
}

// Add item to cart
export async function addToCart(
  productId: string,
  quantity: number,
  unitPrice?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = await getSessionId();
    const result = await cartService.addItemToCart(sessionId, productId, quantity, unitPrice);
    
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to cart'
    };
  }
}

// Update cart item quantity
export async function updateCartQuantity(
  itemId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cartService.updateCartItemQuantity(itemId, quantity);
    
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update quantity'
    };
  }
}

// Remove item from cart
export async function removeFromCart(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cartService.removeCartItem(itemId);
    
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item'
    };
  }
}

// Clear entire cart
export async function clearCartAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionId = await getSessionId();
    const result = await cartService.clearCart(sessionId);
    
    if (result.success) {
      revalidatePath('/');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cart'
    };
  }
}
