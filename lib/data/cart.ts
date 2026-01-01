// Shopping cart data access layer
import { client, handleAmplifyError, calculateCartTotals, generateSessionId } from '@/lib/amplify-client';
import type { ShoppingCart, CartItem } from '@/types';
import { InventoryService } from './inventory';

export class CartService {
  // Get cart for authenticated user
  static async getUserCart(customerId: string) {
    try {
      const response = await client.models.ShoppingCart.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      let cart = response.data?.[0];

      // If no cart exists, create one
      if (!cart) {
        const createResponse = await client.models.ShoppingCart.create({
          customerId,
          subtotal: 0,
          estimatedTax: 0,
          estimatedShipping: 0,
          estimatedTotal: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });
        cart = createResponse.data!;
      }

      return {
        cart: cart!,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get cart for guest user by session ID
  static async getGuestCart(sessionId: string) {
    console.log('CartService: getGuestCart called with sessionId:', sessionId);
    
    try {
      const response = await client.models.ShoppingCart.list({
        filter: {
          sessionId: { eq: sessionId }
        }
      });

      console.log('CartService: Guest cart list response:', response);
      let cart = response.data?.[0];

      // If no cart exists, create one
      if (!cart) {
        console.log('CartService: Creating new guest cart');
        const createResponse = await client.models.ShoppingCart.create({
          sessionId,
          subtotal: 0,
          estimatedTax: 0,
          estimatedShipping: 0,
          estimatedTotal: 0,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days for guests
        });
        console.log('CartService: Create guest cart response:', createResponse);
        cart = createResponse.data!;
      }

      return {
        cart: cart!,
        errors: response.errors
      };
    } catch (error) {
      console.error('CartService: Error in getGuestCart:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get cart items
  static async getCartItems(cartId: string) {
    try {
      const response = await client.models.CartItem.list({
        filter: {
          cartId: { eq: cartId }
        }
      });

      return {
        items: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Add item to cart
  static async addItemToCart(cartId: string, productId: string, quantity: number, unitPrice: number) {
    try {
      // Check if item already exists in cart
      const existingItemsResponse = await client.models.CartItem.list({
        filter: {
          and: [
            { cartId: { eq: cartId } },
            { productId: { eq: productId } }
          ]
        }
      });

      const existingItem = existingItemsResponse.data?.[0];

      let response;
      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + quantity;
        response = await client.models.CartItem.update({
          id: existingItem.id,
          quantity: newQuantity,
          totalPrice: newQuantity * unitPrice
        });
      } else {
        // Create new cart item
        response = await client.models.CartItem.create({
          cartId,
          productId,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice
        });
      }

      // Update cart totals
      await this.updateCartTotals(cartId);

      return {
        item: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update item quantity
  static async updateItemQuantity(itemId: string, quantity: number) {
    try {
      // Get the item to calculate new total
      const itemResponse = await client.models.CartItem.get({ id: itemId });
      
      if (!itemResponse.data) {
        throw new Error('Cart item not found');
      }

      const item = itemResponse.data;
      const newTotalPrice = quantity * item.unitPrice;

      const response = await client.models.CartItem.update({
        id: itemId,
        quantity,
        totalPrice: newTotalPrice
      });

      // Update cart totals
      await this.updateCartTotals(item.cartId);

      return {
        item: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Remove item from cart
  static async removeItemFromCart(itemId: string) {
    try {
      // Get the item to get cart ID for total update
      const itemResponse = await client.models.CartItem.get({ id: itemId });
      const cartId = itemResponse.data?.cartId;

      const response = await client.models.CartItem.delete({ id: itemId });

      // Update cart totals if we have cart ID
      if (cartId) {
        await this.updateCartTotals(cartId);
      }

      return {
        success: true,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Clear entire cart
  static async clearCart(cartId: string) {
    try {
      // Get all cart items
      const itemsResponse = await this.getCartItems(cartId);
      
      // Delete all items
      const deletePromises = itemsResponse.items.map(item =>
        client.models.CartItem.delete({ id: item.id })
      );

      await Promise.all(deletePromises);

      // Update cart totals to zero
      await client.models.ShoppingCart.update({
        id: cartId,
        subtotal: 0,
        estimatedTax: 0,
        estimatedShipping: 0,
        estimatedTotal: 0
      });

      return {
        success: true,
        errors: null
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update cart totals based on current items
  static async updateCartTotals(cartId: string) {
    try {
      const itemsResponse = await this.getCartItems(cartId);
      const items = itemsResponse.items;

      const totals = calculateCartTotals(items.map(item => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })));

      const response = await client.models.ShoppingCart.update({
        id: cartId,
        ...totals
      });

      return {
        cart: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Validate cart items against inventory
  static async validateCartInventory(cartId: string) {
    try {
      const itemsResponse = await this.getCartItems(cartId);
      const items = itemsResponse.items;

      const validationResults = await Promise.all(
        items.map(async (item) => {
          const isInStock = await InventoryService.isProductInStock(item.productId, item.quantity);
          return {
            itemId: item.id,
            productId: item.productId,
            requestedQuantity: item.quantity,
            isAvailable: isInStock
          };
        })
      );

      const unavailableItems = validationResults.filter(result => !result.isAvailable);

      return {
        isValid: unavailableItems.length === 0,
        unavailableItems,
        errors: null
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Transfer guest cart to user cart on login
  static async transferGuestCartToUser(sessionId: string, customerId: string) {
    try {
      // Get guest cart
      const guestCartResponse = await this.getGuestCart(sessionId);
      const guestCart = guestCartResponse.cart;

      if (!guestCart) {
        return { success: true, errors: null };
      }

      // Get or create user cart
      const userCartResponse = await this.getUserCart(customerId);
      const userCart = userCartResponse.cart;

      if (!userCart) {
        throw new Error('Failed to create user cart');
      }

      // Get guest cart items
      const guestItemsResponse = await this.getCartItems(guestCart.id);
      const guestItems = guestItemsResponse.items;

      // Transfer items to user cart
      for (const item of guestItems) {
        await this.addItemToCart(userCart.id, item.productId, item.quantity, item.unitPrice);
      }

      // Delete guest cart and its items
      await this.clearCart(guestCart.id);
      await client.models.ShoppingCart.delete({ id: guestCart.id });

      return {
        success: true,
        errors: null
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }
}