'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CartService } from '@/lib/data/cart';
import { generateSessionId } from '@/lib/amplify-client';
import { useAuth } from './auth-provider';
import type { ShoppingCart, CartItem } from '@/types';

interface CartContextType {
  cart: ShoppingCart | null;
  items: CartItem[];
  isLoading: boolean;
  itemCount: number;
  totalAmount: number;
  addItem: (productId: string, quantity: number, unitPrice: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  validateInventory: () => Promise<{ isValid: boolean; unavailableItems: any[] }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<ShoppingCart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Initialize session ID after component mounts to prevent SSR mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSessionId = localStorage.getItem('cart_session_id');
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = generateSessionId();
        localStorage.setItem('cart_session_id', newSessionId);
        setSessionId(newSessionId);
      }
    }
  }, []);

  // Load cart data
  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // TEMPORARY: Use mock cart data for UI development
      console.log('Using mock cart data for UI development');
      
      // Set mock cart data
      const mockCart: ShoppingCart = {
        id: 'mock-cart-1',
        customerId: user?.userId || undefined,
        sessionId: !user?.userId ? sessionId : undefined,
        subtotal: 778,
        estimatedTax: 140.04, // 18% GST
        estimatedShipping: 0, // No shipping for now
        estimatedTotal: 918.04,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockItems: CartItem[] = [
        {
          id: 'item-1',
          cartId: 'mock-cart-1',
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 240,
          totalPrice: 480,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'item-2',
          cartId: 'mock-cart-1',
          productId: 'prod-2',
          quantity: 1,
          unitPrice: 149,
          totalPrice: 149,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'item-3',
          cartId: 'mock-cart-1',
          productId: 'prod-3',
          quantity: 1,
          unitPrice: 149,
          totalPrice: 149,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setCart(mockCart);
      setItems(mockItems);
      
      /* DISABLED FOR UI DEVELOPMENT
      let cartResponse;

      if (isAuthenticated && user?.userId) {
        // Load user cart
        cartResponse = await CartService.getUserCart(user.userId);
      } else if (sessionId) {
        // Load guest cart
        cartResponse = await CartService.getGuestCart(sessionId);
      } else {
        setIsLoading(false);
        return;
      }

      if (cartResponse.cart) {
        setCart(cartResponse.cart as unknown as ShoppingCart);
        
        // Load cart items
        const itemsResponse = await CartService.getCartItems(cartResponse.cart.id);
        setItems(itemsResponse.items as unknown as CartItem[]);
      }
      */
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart(null);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.userId, sessionId]);

  // Transfer guest cart to user cart on login
  useEffect(() => {
    const transferGuestCart = async () => {
      // TEMPORARY: Disable cart transfer for UI development
      console.log('Mock: Cart transfer disabled for UI development');
      return;
      
      /* DISABLED FOR UI DEVELOPMENT
      if (isAuthenticated && user?.userId && sessionId) {
        try {
          await CartService.transferGuestCartToUser(sessionId, user.userId);
          // Clear session ID after transfer
          localStorage.removeItem('cart_session_id');
          setSessionId('');
          // Reload cart to get the transferred items
          await loadCart();
        } catch (error) {
          console.error('Error transferring guest cart:', error);
        }
      }
      */
    };

    transferGuestCart();
  }, [isAuthenticated, user?.userId, sessionId, loadCart]);

  // Load cart when authentication state or session changes
  useEffect(() => {
    if ((isAuthenticated && user?.userId) || (!isAuthenticated && sessionId)) {
      loadCart();
    }
  }, [loadCart, isAuthenticated, user?.userId, sessionId]);

  // Add item to cart
  const addItem = async (productId: string, quantity: number, unitPrice: number) => {
    // TEMPORARY: Disable cart API calls for UI development
    console.log(`Mock: Adding ${quantity} of product ${productId} to cart (price: ${unitPrice})`);
    return;
    
    /* DISABLED FOR UI DEVELOPMENT - Original code below
    // Ensure we have a cart - create one if needed
    let currentCart = cart;
    
    if (!currentCart) {
      try {
        let cartResponse;
        
        if (isAuthenticated && user?.userId) {
          cartResponse = await CartService.getUserCart(user.userId);
        } else if (sessionId) {
          cartResponse = await CartService.getGuestCart(sessionId);
        } else {
          throw new Error('No user ID or session ID available');
        }
        
        if (cartResponse.cart) {
          currentCart = cartResponse.cart as unknown as ShoppingCart;
          setCart(currentCart);
        } else {
          throw new Error('Failed to create or retrieve cart');
        }
      } catch (error) {
        console.error('Error creating cart:', error);
        throw new Error('Failed to initialize cart');
      }
    }

    try {
      await CartService.addItemToCart(currentCart.id, productId, quantity, unitPrice);
      await loadCart(); // Refresh cart data
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
    */
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    // TEMPORARY: Disable cart API calls for UI development
    console.log(`Mock: Removing item ${itemId} from cart`);
    return;
    
    /* DISABLED FOR UI DEVELOPMENT
    try {
      await CartService.removeItemFromCart(itemId);
      await loadCart(); // Refresh cart data
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
    */
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    // TEMPORARY: Disable cart API calls for UI development
    console.log(`Mock: Updating item ${itemId} quantity to ${quantity}`);
    return;
    
    /* DISABLED FOR UI DEVELOPMENT
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      await CartService.updateItemQuantity(itemId, quantity);
      await loadCart(); // Refresh cart data
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
    */
  };

  // Clear entire cart
  const clearCart = async () => {
    // TEMPORARY: Disable cart API calls for UI development
    console.log('Mock: Clearing cart');
    return;
    
    /* DISABLED FOR UI DEVELOPMENT
    if (!cart) return;

    try {
      await CartService.clearCart(cart.id);
      await loadCart(); // Refresh cart data
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
    */
  };

  // Refresh cart data
  const refreshCart = async () => {
    // TEMPORARY: Disable cart API calls for UI development
    console.log('Mock: Refreshing cart');
    return;
    
    /* DISABLED FOR UI DEVELOPMENT
    await loadCart();
    */
  };

  // Validate cart inventory
  const validateInventory = async () => {
    // TEMPORARY: Return mock validation for UI development
    console.log('Mock: Validating cart inventory');
    return { isValid: true, unavailableItems: [] };
    
    /* DISABLED FOR UI DEVELOPMENT
    if (!cart) {
      return { isValid: true, unavailableItems: [] };
    }

    try {
      const validation = await CartService.validateCartInventory(cart.id);
      return {
        isValid: validation.isValid,
        unavailableItems: validation.unavailableItems
      };
    } catch (error) {
      console.error('Error validating cart inventory:', error);
      return { isValid: false, unavailableItems: [] };
    }
    */
  };

  // Calculate derived values
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart?.estimatedTotal || 0;

  const value: CartContextType = {
    cart,
    items,
    isLoading,
    itemCount,
    totalAmount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart,
    validateInventory,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}