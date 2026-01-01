// Mock cart data and service for development
import type { ShoppingCart, CartItem } from '@/types';
import { mockProducts } from './mock-products';

// In-memory storage for mock data
let mockCarts: ShoppingCart[] = [];
let mockCartItems: CartItem[] = [];
let cartIdCounter = 1;
let itemIdCounter = 1;

// Helper function to generate IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2);

// Helper function to calculate cart totals
function calculateCartTotals(items: Array<{ quantity: number; unitPrice: number }>) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const estimatedTax = subtotal * 0.18; // 18% GST for India
  const estimatedShipping = subtotal > 2000 ? 0 : 100; // Free shipping above ₹2000
  const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

  return {
    subtotal,
    estimatedTax,
    estimatedShipping,
    estimatedTotal,
  };
}

export class MockCartService {
  // Get cart for authenticated user
  static async getUserCart(customerId: string) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    let cart = mockCarts.find(c => c.customerId === customerId);

    // If no cart exists, create one
    if (!cart) {
      cart = {
        id: generateId(),
        customerId,
        subtotal: 0,
        estimatedTax: 0,
        estimatedShipping: 0,
        estimatedTotal: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockCarts.push(cart);
    }

    return {
      cart,
      errors: null
    };
  }

  // Get cart for guest user by session ID
  static async getGuestCart(sessionId: string) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    let cart = mockCarts.find(c => c.sessionId === sessionId);

    // If no cart exists, create one
    if (!cart) {
      cart = {
        id: generateId(),
        sessionId,
        subtotal: 0,
        estimatedTax: 0,
        estimatedShipping: 0,
        estimatedTotal: 0,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days for guests
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockCarts.push(cart);
    }

    return {
      cart,
      errors: null
    };
  }

  // Get cart items
  static async getCartItems(cartId: string) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API delay
    
    const items = mockCartItems.filter(item => item.cartId === cartId);
    
    // Add product information to items
    const itemsWithProducts = items.map(item => {
      const product = mockProducts.find(p => p.id === item.productId);
      return {
        ...item,
        product
      };
    });

    return {
      items: itemsWithProducts,
      errors: null
    };
  }

  // Add item to cart
  static async addItemToCart(cartId: string, productId: string, quantity: number, unitPrice: number) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    // Check if item already exists in cart
    const existingItemIndex = mockCartItems.findIndex(
      item => item.cartId === cartId && item.productId === productId
    );

    let item;
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const existingItem = mockCartItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      item = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: newQuantity * unitPrice,
        updatedAt: new Date().toISOString()
      };
      mockCartItems[existingItemIndex] = item;
    } else {
      // Create new cart item
      item = {
        id: generateId(),
        cartId,
        productId,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockCartItems.push(item);
    }

    // Update cart totals
    await this.updateCartTotals(cartId);

    return {
      item,
      errors: null
    };
  }

  // Update item quantity
  static async updateItemQuantity(itemId: string, quantity: number) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    const itemIndex = mockCartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    const item = mockCartItems[itemIndex];
    const updatedItem = {
      ...item,
      quantity,
      totalPrice: quantity * item.unitPrice,
      updatedAt: new Date().toISOString()
    };
    
    mockCartItems[itemIndex] = updatedItem;

    // Update cart totals
    await this.updateCartTotals(item.cartId);

    return {
      item: updatedItem,
      errors: null
    };
  }

  // Remove item from cart
  static async removeItemFromCart(itemId: string) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    const itemIndex = mockCartItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    const item = mockCartItems[itemIndex];
    const cartId = item.cartId;
    
    mockCartItems.splice(itemIndex, 1);

    // Update cart totals
    await this.updateCartTotals(cartId);

    return {
      success: true,
      errors: null
    };
  }

  // Clear entire cart
  static async clearCart(cartId: string) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    // Remove all items for this cart
    mockCartItems = mockCartItems.filter(item => item.cartId !== cartId);

    // Update cart totals to zero
    const cartIndex = mockCarts.findIndex(cart => cart.id === cartId);
    if (cartIndex >= 0) {
      mockCarts[cartIndex] = {
        ...mockCarts[cartIndex],
        subtotal: 0,
        estimatedTax: 0,
        estimatedShipping: 0,
        estimatedTotal: 0,
        updatedAt: new Date().toISOString()
      };
    }

    return {
      success: true,
      errors: null
    };
  }

  // Update cart totals based on current items
  static async updateCartTotals(cartId: string) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API delay
    
    const items = mockCartItems.filter(item => item.cartId === cartId);
    const totals = calculateCartTotals(items.map(item => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })));

    const cartIndex = mockCarts.findIndex(cart => cart.id === cartId);
    if (cartIndex >= 0) {
      mockCarts[cartIndex] = {
        ...mockCarts[cartIndex],
        ...totals,
        updatedAt: new Date().toISOString()
      };
    }

    return {
      cart: mockCarts[cartIndex],
      errors: null
    };
  }

  // Validate cart items against inventory (mock - always return true for now)
  static async validateCartInventory(cartId: string) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API delay
    
    const items = mockCartItems.filter(item => item.cartId === cartId);
    
    // For mock data, assume all items are available
    const validationResults = items.map(item => ({
      itemId: item.id,
      productId: item.productId,
      requestedQuantity: item.quantity,
      isAvailable: true
    }));

    return {
      isValid: true,
      unavailableItems: [],
      errors: null
    };
  }

  // Transfer guest cart to user cart on login
  static async transferGuestCartToUser(sessionId: string, customerId: string) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
    
    // Find guest cart
    const guestCartIndex = mockCarts.findIndex(cart => cart.sessionId === sessionId);
    
    if (guestCartIndex === -1) {
      return { success: true, errors: null };
    }

    const guestCart = mockCarts[guestCartIndex];

    // Get or create user cart
    const userCartResponse = await this.getUserCart(customerId);
    const userCart = userCartResponse.cart;

    if (!userCart) {
      throw new Error('Failed to create user cart');
    }

    // Get guest cart items
    const guestItems = mockCartItems.filter(item => item.cartId === guestCart.id);

    // Transfer items to user cart
    for (const item of guestItems) {
      await this.addItemToCart(userCart.id, item.productId, item.quantity, item.unitPrice);
    }

    // Remove guest cart and its items
    mockCarts.splice(guestCartIndex, 1);
    mockCartItems = mockCartItems.filter(item => item.cartId !== guestCart.id);

    return {
      success: true,
      errors: null
    };
  }
}