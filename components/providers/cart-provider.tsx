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
  
  // Initialize session ID immediately for guest users
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedSessionId = localStorage.getItem('cart_session_id');
      if (storedSessionId) {
        return storedSessionId;
      } else {
        const newSessionId = generateSessionId();
        localStorage.setItem('cart_session_id', newSessionId);
        return newSessionId;
      }
    }
    return '';
  });

  // Load cart data
  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true);
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
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      await CartService.removeItemFromCart(itemId);
      await loadCart(); // Refresh cart data
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
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
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!cart) return;

    try {
      await CartService.clearCart(cart.id);
      await loadCart(); // Refresh cart data
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  // Refresh cart data
  const refreshCart = async () => {
    await loadCart();
  };

  // Validate cart inventory
  const validateInventory = async () => {
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