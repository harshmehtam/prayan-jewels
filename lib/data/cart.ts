// @ts-nocheck
// Cart data access layer - Real Amplify GraphQL Integration
import { getDynamicClient, handleAmplifyError, generateSessionId } from '@/lib/amplify-client';

export class CartService {
  // Get user cart by customer ID
  static async getUserCart(customerId: string): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      const response = await client.models.ShoppingCart.list({
        filter: { customerId: { eq: customerId } }
      });

      let cart = response.data?.[0] || null;

      // Create cart if it doesn't exist
      if (!cart) {
        const createResponse = await client.models.ShoppingCart.create({
          customerId,
          subtotal: 0,
          estimatedTax: 0,
          estimatedShipping: 0,
          estimatedTotal: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });
        cart = createResponse.data || null;
      }

      return {
        // @ts-ignore - Type compatibility between Amplify generated types and custom types
        cart,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error getting user cart:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get guest cart by session ID
  static async getGuestCart(sessionId: string): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      const response = await client.models.ShoppingCart.list({
        filter: { sessionId: { eq: sessionId } }
      });

      let cart = response.data?.[0] || null;

      // Create cart if it doesn't exist
      if (!cart) {
        const createResponse = await client.models.ShoppingCart.create({
          sessionId,
          subtotal: 0,
          estimatedTax: 0,
          estimatedShipping: 0,
          estimatedTotal: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });
        cart = createResponse.data || null;
      }

      return {
        // @ts-ignore - Type compatibility between Amplify generated types and custom types
        cart,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error getting guest cart:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get cart items by cart ID
  static async getCartItems(cartId: string): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      const response = await client.models.CartItem.list({
        filter: { cartId: { eq: cartId } }
      });

      return {
        items: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Add item to cart
  static async addItemToCart(cartId: string, productId: string, quantity: number, unitPrice: number): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      // Check if item already exists in cart
      const existingItemsResponse = await client.models.CartItem.list({
        filter: { 
          cartId: { eq: cartId },
          productId: { eq: productId }
        }
      });

      const existingItem = existingItemsResponse.data?.[0];

      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity;
        const response = await client.models.CartItem.update({
          id: existingItem.id,
          quantity: newQuantity,
          totalPrice: newQuantity * unitPrice
        });
        
        await this.updateCartTotals(cartId);
        return { item: response.data, errors: response.errors };
      } else {
        // Create new cart item
        const response = await client.models.CartItem.create({
          cartId,
          productId,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice
        });
        
        await this.updateCartTotals(cartId);
        return { item: response.data, errors: response.errors };
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Remove item from cart
  static async removeItemFromCart(itemId: string): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      // Get the item to find the cart ID
      const itemResponse = await client.models.CartItem.get({ id: itemId });
      const cartId = itemResponse.data?.cartId;

      const response = await client.models.CartItem.delete({ id: itemId });
      
      if (cartId) {
        await this.updateCartTotals(cartId);
      }
      
      return {
        success: !!response.data,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update item quantity
  static async updateItemQuantity(itemId: string, quantity: number): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      // Get the item to calculate new total
      const itemResponse = await client.models.CartItem.get({ id: itemId });
      const item = itemResponse.data;
      
      if (!item) {
        throw new Error('Cart item not found');
      }

      const response = await client.models.CartItem.update({
        id: itemId,
        quantity,
        totalPrice: quantity * item.unitPrice
      });
      
      await this.updateCartTotals(item.cartId);
      
      return {
        item: response.data,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Clear entire cart
  static async clearCart(cartId: string): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      // Get all cart items
      const itemsResponse = await client.models.CartItem.list({
        filter: { cartId: { eq: cartId } }
      });

      // Delete all items
      const deletePromises = (itemsResponse.data || []).map(item =>
        client.models.CartItem.delete({ id: item.id })
      );
      
      await Promise.all(deletePromises);
      
      // Update cart totals to zero
      await this.updateCartTotals(cartId);
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Transfer guest cart to user cart
  static async transferGuestCartToUser(sessionId: string, customerId: string): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      // Get guest cart
      const guestCartResponse = await client.models.ShoppingCart.list({
        filter: { sessionId: { eq: sessionId } }
      });
      
      const guestCart = guestCartResponse.data?.[0];
      if (!guestCart) {
        return { success: true }; // No guest cart to transfer
      }

      // Get or create user cart
      const userCartResult = await this.getUserCart(customerId);
      const userCart = userCartResult.cart;
      
      if (!userCart) {
        throw new Error('Failed to create user cart');
      }

      // Get guest cart items
      const guestItemsResponse = await client.models.CartItem.list({
        filter: { cartId: { eq: guestCart.id } }
      });

      // Transfer items to user cart
      const transferPromises = (guestItemsResponse.data || []).map(async (item) => {
        // Check if item already exists in user cart
        const existingItemsResponse = await client.models.CartItem.list({
          filter: { 
            cartId: { eq: userCart.id },
            productId: { eq: item.productId }
          }
        });

        const existingItem = existingItemsResponse.data?.[0];

        if (existingItem) {
          // Update existing item quantity
          const newQuantity = existingItem.quantity + item.quantity;
          return client.models.CartItem.update({
            id: existingItem.id,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice
          });
        } else {
          // Create new item in user cart
          return client.models.CartItem.create({
            cartId: userCart.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          });
        }
      });

      await Promise.all(transferPromises);

      // Delete guest cart and its items
      await this.clearCart(guestCart.id);
      await client.models.ShoppingCart.delete({ id: guestCart.id });

      // Update user cart totals
      await this.updateCartTotals(userCart.id);

      return { success: true };
    } catch (error) {
      console.error('Error transferring guest cart:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Validate cart inventory
  static async validateCartInventory(cartId: string): Promise<any> {
    try {
      const client = await getDynamicClient();
      
      // Get cart items
      const itemsResponse = await client.models.CartItem.list({
        filter: { cartId: { eq: cartId } }
      });

      const items = itemsResponse.data || [];
      const unavailableItems: any[] = [];

      // Check each item's availability
      for (const item of items) {
        try {
          const inventoryResponse = await client.models.InventoryItem.list({
            filter: { productId: { eq: item.productId } }
          });
          
          const inventory = inventoryResponse.data?.[0];
          const availableQuantity = inventory ? 
            (inventory.stockQuantity || 0) - (inventory.reservedQuantity || 0) : 0;

          if (availableQuantity < item.quantity) {
            unavailableItems.push({
              itemId: item.id,
              productId: item.productId,
              requestedQuantity: item.quantity,
              availableQuantity
            });
          }
        } catch (inventoryError) {
          // If we can't check inventory (guest user), assume it's available
          console.warn('Could not check inventory for product:', item.productId);
        }
      }

      return {
        isValid: unavailableItems.length === 0,
        unavailableItems
      };
    } catch (error) {
      console.error('Error validating cart inventory:', error);
      return {
        isValid: false,
        unavailableItems: []
      };
    }
  }

  // Helper method to update cart totals
  private static async updateCartTotals(cartId: string): Promise<void> {
    try {
      const client = await getDynamicClient();
      
      // Get all cart items
      const itemsResponse = await client.models.CartItem.list({
        filter: { cartId: { eq: cartId } }
      });

      const items = itemsResponse.data || [];
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const estimatedTax = subtotal * 0.18; // 18% GST for India
      const estimatedShipping = subtotal > 2000 ? 0 : 100; // Free shipping above ₹2000
      const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

      // Update cart
      await client.models.ShoppingCart.update({
        id: cartId,
        subtotal,
        estimatedTax,
        estimatedShipping,
        estimatedTotal
      });
    } catch (error) {
      console.error('Error updating cart totals:', error);
      // Don't throw error for total updates
    }
  }
}