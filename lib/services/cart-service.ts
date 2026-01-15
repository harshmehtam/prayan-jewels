import { cookiesClient } from '@/utils/amplify-utils';
import type { CartItem, ShoppingCart } from '@/types';

export interface CartWithItems extends ShoppingCart {
  items: CartItem[];
}

// Generate a unique session ID for guest users
export function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get or create cart for a session
export async function getOrCreateCart(sessionId: string) {
  try {
    const client = await cookiesClient;
    
    // Try to find existing cart
    const cartResponse = await client.models.ShoppingCart.list({
      filter: { sessionId: { eq: sessionId } },
      authMode: 'iam'
    });

    let cart = cartResponse.data?.[0];

    // Create cart if it doesn't exist
    if (!cart) {
      const createResponse = await client.models.ShoppingCart.create({
        sessionId,
        subtotal: 0,
        estimatedTax: 0,
        estimatedShipping: 0,
        estimatedTotal: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        authMode: 'iam'
      });
      
      if (createResponse.data) {
        cart = createResponse.data;
      }
    }

    return cart;
  } catch (error) {
    console.error('Error getting or creating cart:', error);
    return null;
  }
}

// Get cart with items and product details
export async function getCartWithItems(sessionId: string): Promise<CartWithItems | null> {
  try {
    const cart = await getOrCreateCart(sessionId);
    if (!cart) return null;

    const client = await cookiesClient;
    
    // Get cart items
    const itemsResponse = await client.models.CartItem.list({
      filter: { cartId: { eq: cart.id } },
      authMode: 'iam'
    });

    const items = itemsResponse.data || [];
    
    // Get product details for all items
    const enrichedItems: CartItem[] = [];
    for (const item of items) {
      const productResponse = await client.models.Product.get(
        { id: item.productId },
        { authMode: 'iam' }
      );
      
      enrichedItems.push({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: productResponse.data ? {
          id: productResponse.data.id,
          name: productResponse.data.name,
          description: productResponse.data.description,
          price: productResponse.data.price,
          actualPrice: productResponse.data.actualPrice,
          images: productResponse.data.images?.filter((img): img is string => img !== null) || [],
          isActive: productResponse.data.isActive,
          viewCount: productResponse.data.viewCount,
          createdAt: productResponse.data.createdAt,
          updatedAt: productResponse.data.updatedAt,
        } : undefined
      });
    }

    return {
      id: cart.id,
      sessionId: cart.sessionId || undefined,
      customerId: cart.customerId || undefined,
      subtotal: cart.subtotal || 0,
      estimatedTax: cart.estimatedTax || 0,
      estimatedShipping: cart.estimatedShipping || 0,
      estimatedTotal: cart.estimatedTotal || 0,
      expiresAt: cart.expiresAt || '',
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: enrichedItems
    };
  } catch (error) {
    console.error('Error loading cart:', error);
    return null;
  }
}

// Add item to cart
export async function addItemToCart(
  sessionId: string,
  productId: string,
  quantity: number,
  unitPrice: number
) {
  try {
    const cart = await getOrCreateCart(sessionId);
    if (!cart) {
      return { success: false, error: 'Failed to create cart' };
    }

    const client = await cookiesClient;

    // Check if item already exists
    const existingItemsResponse = await client.models.CartItem.list({
      filter: { 
        and: [
          { cartId: { eq: cart.id } },
          { productId: { eq: productId } }
        ]
      },
      authMode: 'iam'
    });

    const existingItem = existingItemsResponse.data?.[0];

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      await client.models.CartItem.update({
        id: existingItem.id,
        quantity: newQuantity,
        totalPrice: newQuantity * unitPrice
      }, {
        authMode: 'iam'
      });
    } else {
      // Create new item
      await client.models.CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice
      }, {
        authMode: 'iam'
      });
    }

    // Recalculate totals
    await recalculateCartTotals(cart.id);

    return { success: true };
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item'
    };
  }
}

// Update item quantity
export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    const client = await cookiesClient;

    if (quantity <= 0) {
      return await removeCartItem(itemId);
    }

    // Get the item
    const itemResponse = await client.models.CartItem.get(
      { id: itemId },
      { authMode: 'iam' }
    );
    
    if (!itemResponse.data) {
      return { success: false, error: 'Item not found' };
    }

    const item = itemResponse.data;

    // Get current product price
    const productResponse = await client.models.Product.get(
      { id: item.productId },
      { authMode: 'iam' }
    );
    const currentPrice = productResponse.data?.price || item.unitPrice;

    // Update the item
    await client.models.CartItem.update({
      id: itemId,
      quantity,
      unitPrice: currentPrice,
      totalPrice: quantity * currentPrice
    }, {
      authMode: 'iam'
    });

    // Recalculate totals
    await recalculateCartTotals(item.cartId);

    return { success: true };
  } catch (error) {
    console.error('Error updating quantity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update quantity'
    };
  }
}

// Remove item from cart
export async function removeCartItem(itemId: string) {
  try {
    const client = await cookiesClient;

    // Get the item first
    const itemResponse = await client.models.CartItem.get(
      { id: itemId },
      { authMode: 'iam' }
    );
    
    if (!itemResponse.data) {
      return { success: false, error: 'Item not found' };
    }

    const cartId = itemResponse.data.cartId;

    // Delete the item
    await client.models.CartItem.delete(
      { id: itemId },
      { authMode: 'iam' }
    );

    // Recalculate totals
    await recalculateCartTotals(cartId);

    return { success: true };
  } catch (error) {
    console.error('Error removing item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item'
    };
  }
}

// Clear all items from cart
export async function clearCart(sessionId: string) {
  try {
    const cart = await getOrCreateCart(sessionId);
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }

    const client = await cookiesClient;

    // Get all items
    const itemsResponse = await client.models.CartItem.list({
      filter: { cartId: { eq: cart.id } },
      authMode: 'iam'
    });

    // Delete all items
    for (const item of itemsResponse.data || []) {
      await client.models.CartItem.delete(
        { id: item.id },
        { authMode: 'iam' }
      );
    }

    // Reset cart totals
    await client.models.ShoppingCart.update({
      id: cart.id,
      subtotal: 0,
      estimatedTax: 0,
      estimatedShipping: 0,
      estimatedTotal: 0
    }, {
      authMode: 'iam'
    });

    return { success: true };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cart'
    };
  }
}

// Get cart item count
export async function getCartItemCount(sessionId: string): Promise<number> {
  try {
    const cart = await getOrCreateCart(sessionId);
    if (!cart) return 0;

    const client = await cookiesClient;
    const itemsResponse = await client.models.CartItem.list({
      filter: { cartId: { eq: cart.id } },
      authMode: 'iam'
    });

    const items = itemsResponse.data || [];
    return items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
}

// Recalculate cart totals
async function recalculateCartTotals(cartId: string) {
  try {
    const client = await cookiesClient;

    // Get all items
    const itemsResponse = await client.models.CartItem.list({
      filter: { cartId: { eq: cartId } },
      authMode: 'iam'
    });

    const items = itemsResponse.data || [];

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const estimatedTax = subtotal * 0.18; // 18% GST
    const estimatedShipping = subtotal > 2000 ? 0 : 100;
    const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

    // Update cart
    await client.models.ShoppingCart.update({
      id: cartId,
      subtotal,
      estimatedTax,
      estimatedShipping,
      estimatedTotal
    }, {
      authMode: 'iam'
    });
  } catch (error) {
    console.error('Error recalculating totals:', error);
  }
}
