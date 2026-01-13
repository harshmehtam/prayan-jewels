'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuth } from './auth-provider';
import type { Schema } from '@/amplify/data/resource';
import type { ShoppingCart, CartItem, Product } from '@/types';

// Generate a unique session ID for guest users
function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

const client = generateClient<Schema>();

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
  syncPrices: () => Promise<void>;
  recalculateCartTotals: () => Promise<void>;
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
  const [cart, setCart] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSessionId = localStorage.getItem('cart_session_id');
      if (storedSessionId && storedSessionId.trim() !== '') {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = generateSessionId();
        localStorage.setItem('cart_session_id', newSessionId);
        setSessionId(newSessionId);
      }
    }
  }, []);

  // Get or create cart
  const getOrCreateCart = useCallback(async (): Promise<any> => {
    try {
      let cartResponse;

      if (isAuthenticated && user?.userId) {
        // Get user cart
        cartResponse = await client.models.ShoppingCart.list({
          filter: { customerId: { eq: user.userId } }
        });
      } else if (sessionId) {
        // Get guest cart
        cartResponse = await client.models.ShoppingCart.list({
          filter: { sessionId: { eq: sessionId } }
        });
      } else {
        return null;
      }

      let cart = cartResponse.data?.[0] || null;

      // Create cart if it doesn't exist
      if (!cart) {
        const createData = isAuthenticated && user?.userId
          ? {
              customerId: user.userId,
              subtotal: 0,
              estimatedTax: 0,
              estimatedShipping: 0,
              estimatedTotal: 0,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          : {
              sessionId: sessionId,
              subtotal: 0,
              estimatedTax: 0,
              estimatedShipping: 0,
              estimatedTotal: 0,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

        const createResponse = await client.models.ShoppingCart.create(createData);
        // @ts-ignore - Amplify generated types are complex
        cart = createResponse.data || null;
      }

      return cart;
    } catch (error) {
      return null;
    }
  }, [isAuthenticated, user?.userId, sessionId]);

  // Load cart and items
  const loadCart = useCallback(async () => {
    if (!sessionId && !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const cart = await getOrCreateCart();
      
      if (cart) {
        setCart(cart);
        
        // Load cart items
        const itemsResponse = await client.models.CartItem.list({
          filter: { cartId: { eq: cart.id } }
        });

        const cartItems = itemsResponse.data || [];
        
        // Fetch product details for all cart items
        if (cartItems.length > 0) {
          try {
            // Get unique product IDs from cart items
            const productIds = [...new Set(cartItems.map(item => item.productId))];
            
            // Fetch products using client.models in batch
            const productPromises = productIds.map(id => 
              client.models.Product.get({ id })
            );
            const productResponses = await Promise.all(productPromises);
            
            // Create product map
            const productMap = new Map<string, Product>();
            productResponses.forEach(response => {
              if (response.data) {
                productMap.set(response.data.id, {
                  id: response.data.id,
                  name: response.data.name,
                  description: response.data.description,
                  price: response.data.price,
                  actualPrice: response.data.actualPrice,
                  images: response.data.images?.filter((img: string | null): img is string => img !== null) || [],
                  isActive: response.data.isActive,
                  viewCount: response.data.viewCount,
                  createdAt: response.data.createdAt,
                  updatedAt: response.data.updatedAt,
                } as Product);
              }
            });

            // Enrich cart items with product details
            const enrichedItems = cartItems.map(item => ({
              ...item,
              product: productMap.get(item.productId) || undefined
            }));

            // Check for price mismatches and update if needed
            const priceMismatches = enrichedItems.filter(item =>
              item.product && Math.abs(item.product.price - item.unitPrice) > 0.01
            );

            if (priceMismatches.length > 0) {
              for (const item of priceMismatches) {
                if (item.product) {
                  const newTotalPrice = item.quantity * item.product.price;
                  
                  try {
                    await client.models.CartItem.update({
                      id: item.id,
                      unitPrice: item.product.price,
                      totalPrice: newTotalPrice
                    });

                    // Update local item
                    item.unitPrice = item.product.price;
                    item.totalPrice = newTotalPrice;
                  } catch (error) {
                    console.error('Failed to update price for item:', error);
                  }
                }
              }

              // Recalculate cart totals after price updates
              const subtotal = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);
              const estimatedTax = subtotal * 0.18;
              const estimatedShipping = subtotal > 2000 ? 0 : 100;
              const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

              await client.models.ShoppingCart.update({
                id: cart.id,
                subtotal,
                estimatedTax,
                estimatedShipping,
                estimatedTotal
              });

              // Update local cart state
              setCart({
                ...cart,
                subtotal,
                estimatedTax,
                estimatedShipping,
                estimatedTotal
              });
            }

            setItems(enrichedItems);
          } catch (error) {
            console.error('Error fetching product details for cart items:', error);
            // Fallback: set items without product details
            setItems(cartItems);
          }
        } else {
          setItems([]);
        }
      } else {
        setCart(null);
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart(null);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isAuthenticated, getOrCreateCart]);

  // Load cart when session ID or auth state changes
  useEffect(() => {
    if (sessionId || isAuthenticated) {
      loadCart();
    }
  }, [sessionId, isAuthenticated, loadCart]);

  // Add item to cart
  const addItem = async (productId: string, quantity: number, unitPrice: number) => {
    try {
      const currentCart = cart || await getOrCreateCart();
      
      if (!currentCart) {
        throw new Error('Unable to create cart');
      }

      let newItems = [...items];

      // Check if item already exists in local state
      const existingItemIndex = items.findIndex(item => item.productId === productId);

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        const newTotalPrice = newQuantity * unitPrice;
        
        await client.models.CartItem.update({
          id: existingItem.id,
          quantity: newQuantity,
          totalPrice: newTotalPrice
        });

        // Update local items array
        newItems[existingItemIndex] = { ...existingItem, quantity: newQuantity, totalPrice: newTotalPrice };
        setItems(newItems);
      } else {
        // Create new item
        const newItem = await client.models.CartItem.create({
          cartId: currentCart.id,
          productId,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice
        });

        // Fetch product details for the new item using client.models
        if (newItem.data) {
          try {
            const productResponse = await client.models.Product.get({ id: productId });
            
            if (productResponse.data) {
              const enrichedNewItem = {
                ...newItem.data,
                product: {
                  id: productResponse.data.id,
                  name: productResponse.data.name,
                  description: productResponse.data.description,
                  price: productResponse.data.price,
                  actualPrice: productResponse.data.actualPrice,
                  images: productResponse.data.images?.filter((img: string | null): img is string => img !== null) || [],
                  isActive: productResponse.data.isActive,
                  viewCount: productResponse.data.viewCount,
                  createdAt: productResponse.data.createdAt,
                  updatedAt: productResponse.data.updatedAt,
                } as Product
              };
              
              newItems = [...items, enrichedNewItem];
              setItems(newItems);
            } else {
              newItems = [...items, newItem.data];
              setItems(newItems);
            }
          } catch (error) {
            console.error('Error fetching product details for new item:', error);
            newItems = [...items, newItem.data];
            setItems(newItems);
          }
        }
      }

      // Calculate totals from the updated items array
      const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const estimatedTax = subtotal * 0.18;
      const estimatedShipping = subtotal > 2000 ? 0 : 100;
      const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

      // Update cart in database
      await client.models.ShoppingCart.update({
        id: currentCart.id,
        subtotal,
        estimatedTax,
        estimatedShipping,
        estimatedTotal
      });

      // Update local cart state
      setCart((prevCart: any) => prevCart ? {
        ...prevCart,
        subtotal,
        estimatedTax,
        estimatedShipping,
        estimatedTotal
      } : null);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  };

  // Update cart totals helper
  const updateCartTotalsLocally = useCallback(async (cartId: string) => {
    try {
      // Calculate totals from current local items state
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const estimatedTax = subtotal * 0.18; // 18% GST
      const estimatedShipping = subtotal > 2000 ? 0 : 100;
      const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

      // Update database
      await client.models.ShoppingCart.update({
        id: cartId,
        subtotal,
        estimatedTax,
        estimatedShipping,
        estimatedTotal
      });

      // Update local cart state
      setCart((prevCart: any) => prevCart ? {
        ...prevCart,
        subtotal,
        estimatedTax,
        estimatedShipping,
        estimatedTotal
      } : null);
    } catch (error) {
      console.error('Error updating cart totals:', error);
    }
  }, [items]);

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      // Find item in local state
      const itemToRemove = items.find(item => item.id === itemId);
      if (!itemToRemove) {
        return;
      }
      // Remove from database
      const deleteResult = await client.models.CartItem.delete({ id: itemId });
      if (deleteResult.errors && deleteResult.errors.length > 0) {
        throw new Error(`Failed to delete item: ${deleteResult.errors[0].message}`);
      }
      
      // Update local state
      const newItems = items.filter(item => item.id !== itemId);
      setItems(newItems);
      
      // Calculate totals from the updated items array
      const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const estimatedTax = subtotal * 0.18;
      const estimatedShipping = subtotal > 2000 ? 0 : 100;
      const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

      // Update cart in database
      if (cart) {
        const cartUpdateResult = await client.models.ShoppingCart.update({
          id: cart.id,
          subtotal,
          estimatedTax,
          estimatedShipping,
          estimatedTotal
        });
        
        if (cartUpdateResult.errors && cartUpdateResult.errors.length > 0) {
          console.error('Cart update errors:', cartUpdateResult.errors);
        }

        // Update local cart state
        setCart((prevCart: any) => prevCart ? {
          ...prevCart,
          subtotal,
          estimatedTax,
          estimatedShipping,
          estimatedTotal
        } : null);
      }
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
      // Find item in local state
      const itemIndex = items.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        const item = items[itemIndex];
        
        // Get current product price to ensure we're using the latest price
        let currentUnitPrice = item.unitPrice;
        let currentProduct = item.product;
        
        try {
          const productResponse = await client.models.Product.get({ id: item.productId });
          
          if (productResponse.data) {
            currentProduct = {
              id: productResponse.data.id,
              name: productResponse.data.name,
              description: productResponse.data.description,
              price: productResponse.data.price,
              actualPrice: productResponse.data.actualPrice,
              images: productResponse.data.images?.filter((img: string | null): img is string => img !== null) || [],
              isActive: productResponse.data.isActive,
              viewCount: productResponse.data.viewCount,
              createdAt: productResponse.data.createdAt,
              updatedAt: productResponse.data.updatedAt,
            } as Product;
            
            if (Math.abs(productResponse.data.price - item.unitPrice) > 0.01) {
              currentUnitPrice = productResponse.data.price;
            }
          }
        } catch (error) {
          console.error('Could not fetch current product price:', error);
        }
        
        const newTotalPrice = quantity * currentUnitPrice;
        
        // Update database with current price
        await client.models.CartItem.update({
          id: itemId,
          quantity,
          unitPrice: currentUnitPrice,
          totalPrice: newTotalPrice
        });
        
        // Update local state with product details
        const newItems = [...items];
        newItems[itemIndex] = { 
          ...item, 
          quantity, 
          unitPrice: currentUnitPrice, 
          totalPrice: newTotalPrice,
          product: currentProduct
        };
        setItems(newItems);
        
        // Calculate totals from the updated items array
        const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const estimatedTax = subtotal * 0.18;
        const estimatedShipping = subtotal > 2000 ? 0 : 100;
        const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

        // Update cart in database
        if (cart) {
          await client.models.ShoppingCart.update({
            id: cart.id,
            subtotal,
            estimatedTax,
            estimatedShipping,
            estimatedTotal
          });

          // Update local cart state
          setCart((prevCart: any) => prevCart ? {
            ...prevCart,
            subtotal,
            estimatedTax,
            estimatedShipping,
            estimatedTotal
          } : null);
        }
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!cart) return;

    try {
      // Delete all items from database
      const deletePromises = items.map(item =>
        client.models.CartItem.delete({ id: item.id })
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      setItems([]);
      
      // Update cart totals locally
      await updateCartTotalsLocally(cart.id);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  // Refresh cart
  const refreshCart = async () => {
    await loadCart();
  };

  // Sync cart item prices with current product prices
  const syncPrices = async () => {
    if (!items.length) return;

    try {
      // Get unique product IDs from cart items
      const productIds = [...new Set(items.map(item => item.productId))];
      
      // Fetch current product prices using client.models
      const productPromises = productIds.map(id => 
        client.models.Product.get({ id })
      );
      const productResponses = await Promise.all(productPromises);
      
      // Create product map
      const productMap = new Map<string, Product>();
      productResponses.forEach(response => {
        if (response.data) {
          productMap.set(response.data.id, {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            price: response.data.price,
            actualPrice: response.data.actualPrice,
            images: response.data.images?.filter((img: string | null): img is string => img !== null) || [],
            isActive: response.data.isActive,
            viewCount: response.data.viewCount,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          } as Product);
        }
      });

      // Update items with price mismatches
      let hasUpdates = false;
      const updatedItems = [];
      
      for (const item of items) {
        const currentProduct = productMap.get(item.productId);
        
        if (currentProduct && currentProduct.price !== item.unitPrice) {
          const newTotalPrice = item.quantity * currentProduct.price;
          
          // Update in database
          await client.models.CartItem.update({
            id: item.id,
            unitPrice: currentProduct.price,
            totalPrice: newTotalPrice
          });
          
          // Update local state with product details
          updatedItems.push({
            ...item,
            unitPrice: currentProduct.price,
            totalPrice: newTotalPrice,
            product: currentProduct
          });
          
          hasUpdates = true;
        } else {
          updatedItems.push({
            ...item,
            product: currentProduct || item.product
          });
        }
      }

      // Update local items state if there were changes
      if (hasUpdates) {
        setItems(updatedItems);
        
        // Recalculate cart totals with updated items
        const subtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const estimatedTax = subtotal * 0.18;
        const estimatedShipping = subtotal > 2000 ? 0 : 100;
        const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

        // Update cart in database
        if (cart) {
          await client.models.ShoppingCart.update({
            id: cart.id,
            subtotal,
            estimatedTax,
            estimatedShipping,
            estimatedTotal
          });

          // Update local cart state
          setCart((prevCart: any) => prevCart ? {
            ...prevCart,
            subtotal,
            estimatedTax,
            estimatedShipping,
            estimatedTotal
          } : null);
        }
      }
    } catch (error) {
      console.error('Error syncing cart prices:', error);
    }
  };

  // Recalculate cart totals based on current cart items
  const recalculateCartTotals = async () => {
    if (!cart || !items.length) return;

    try {
      // Calculate totals from current items
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const estimatedTax = subtotal * 0.18;
      const estimatedShipping = subtotal > 2000 ? 0 : 100;
      const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

      // Update cart in database
      await client.models.ShoppingCart.update({
        id: cart.id,
        subtotal,
        estimatedTax,
        estimatedShipping,
        estimatedTotal
      });

      // Update local cart state
      setCart((prevCart: any) => prevCart ? {
        ...prevCart,
        subtotal,
        estimatedTax,
        estimatedShipping,
        estimatedTotal
      } : null);
    } catch (error) {
      console.error('Error recalculating cart totals:', error);
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
    syncPrices,
    recalculateCartTotals,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}