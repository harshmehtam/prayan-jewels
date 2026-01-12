// 'use client';

// import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// // import { getClient } from '@/lib/amplify-client';
// // import { generateSessionId } from '@/lib/amplify-client';
// import { useAuth } from './auth-provider';
// import type { ShoppingCart, CartItem } from '@/types';

// interface CartContextType {
//   cart: ShoppingCart | null;
//   items: CartItem[];
//   isLoading: boolean;
//   itemCount: number;
//   totalAmount: number;
//   addItem: (productId: string, quantity: number, unitPrice: number) => Promise<void>;
//   removeItem: (itemId: string) => Promise<void>;
//   updateQuantity: (itemId: string, quantity: number) => Promise<void>;
//   clearCart: () => Promise<void>;
//   refreshCart: () => Promise<void>;
//   syncPrices: () => Promise<void>;
//   recalculateCartTotals: () => Promise<void>;
// }

// const CartContext = createContext<CartContextType | undefined>(undefined);

// export function useCart() {
//   const context = useContext(CartContext);
//   if (context === undefined) {
//     throw new Error('useCart must be used within a CartProvider');
//   }
//   return context;
// }

// interface CartProviderProps {
//   children: React.ReactNode;
// }

// export function CartProvider({ children }: CartProviderProps) {
//   const { user, isAuthenticated } = useAuth();
//   const [cart, setCart] = useState<any>(null); // Simplified type
//   const [items, setItems] = useState<any[]>([]); // Simplified type
//   const [isLoading, setIsLoading] = useState(true);
//   const [sessionId, setSessionId] = useState<string>('');

//   // Initialize session ID
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const storedSessionId = localStorage.getItem('cart_session_id');
//       if (storedSessionId && storedSessionId.trim() !== '') {
//         setSessionId(storedSessionId);
//       } else {
//         const newSessionId = generateSessionId();
//         localStorage.setItem('cart_session_id', newSessionId);
//         setSessionId(newSessionId);
//       }
//     }
//   }, []);

//   // Get or create cart
//   const getOrCreateCart = useCallback(async (): Promise<any> => {
//     try {
//       const client = await getClient();
//       let cartResponse;

//       if (isAuthenticated && user?.userId) {
//         // Get user cart
//         cartResponse = await client.models.ShoppingCart.list({
//           filter: { customerId: { eq: user.userId } }
//         });
//       } else if (sessionId) {
//         // Get guest cart
//         cartResponse = await client.models.ShoppingCart.list({
//           filter: { sessionId: { eq: sessionId } }
//         });
//       } else {
//         return null;
//       }

//       let cart = cartResponse.data?.[0] || null;

//       // Create cart if it doesn't exist
//       if (!cart) {
//         const createData = isAuthenticated && user?.userId
//           ? {
//               customerId: user.userId,
//               subtotal: 0,
//               estimatedTax: 0,
//               estimatedShipping: 0,
//               estimatedTotal: 0,
//               expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
//             }
//           : {
//               sessionId: sessionId,
//               subtotal: 0,
//               estimatedTax: 0,
//               estimatedShipping: 0,
//               estimatedTotal: 0,
//               expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
//             };

//         const createResponse = await client.models.ShoppingCart.create(createData);
//         // @ts-ignore - Amplify generated types are complex
//         cart = createResponse.data || null;
//       }

//       return cart;
//     } catch (error) {
//       // Suppress auth errors after logout
//       if (error && typeof error === 'object' && 'message' in error) {
//         const errorMessage = (error as any).message;
//         if (errorMessage?.includes('NoValidAuthTokens') || errorMessage?.includes('federated jwt')) {
//           console.log('Auth token expired, user needs to re-authenticate');
//           return null;
//         }
//       }
//       console.error('Error getting/creating cart:', error);
//       return null;
//     }
//   }, [isAuthenticated, user?.userId, sessionId]);

//   // Load cart and items
//   const loadCart = useCallback(async () => {
//     if (!sessionId && !isAuthenticated) {
//       setIsLoading(false);
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const cart = await getOrCreateCart();
      
//       if (cart) {
//         setCart(cart);
        
//         // Load cart items
//         const client = await getClient();
//         const itemsResponse = await client.models.CartItem.list({
//           filter: { cartId: { eq: cart.id } }
//         });

//         const cartItems = itemsResponse.data || [];
//         setItems(cartItems);
//       } else {
//         setCart(null);
//         setItems([]);
//       }
//     } catch (error) {
//       console.error('Error loading cart:', error);
//       setCart(null);
//       setItems([]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [sessionId, isAuthenticated, user?.userId, getOrCreateCart]);

//   // Load cart when session ID or auth state changes
//   useEffect(() => {
//     if (sessionId || isAuthenticated) {
//       loadCart();
//     }
//   }, [sessionId, isAuthenticated, loadCart]);

//   // Add item to cart
//   const addItem = async (productId: string, quantity: number, unitPrice: number) => {
//     try {
//       const currentCart = cart || await getOrCreateCart();
      
//       if (!currentCart) {
//         throw new Error('Unable to create cart');
//       }

//       const client = await getClient();
//       let newItems = [...items];

//       // Check if item already exists in local state
//       const existingItemIndex = items.findIndex(item => item.productId === productId);

//       if (existingItemIndex >= 0) {
//         // Update existing item
//         const existingItem = items[existingItemIndex];
//         const newQuantity = existingItem.quantity + quantity;
//         const newTotalPrice = newQuantity * unitPrice;
        
//         await client.models.CartItem.update({
//           id: existingItem.id,
//           quantity: newQuantity,
//           totalPrice: newTotalPrice
//         });

//         // Update local items array
//         newItems[existingItemIndex] = { ...existingItem, quantity: newQuantity, totalPrice: newTotalPrice };
//         setItems(newItems);
//       } else {
//         // Create new item
//         const newItem = await client.models.CartItem.create({
//           cartId: currentCart.id,
//           productId,
//           quantity,
//           unitPrice,
//           totalPrice: quantity * unitPrice
//         });

//         // Add to local items array
//         if (newItem.data) {
//           newItems = [...items, newItem.data];
//           setItems(newItems);
//         }
//       }

//       // Calculate totals from the updated items array (not the state which might be stale)
//       const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
//       const estimatedTax = subtotal * 0.18; // 18% GST
//       const estimatedShipping = subtotal > 2000 ? 0 : 100;
//       const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

//       // Update cart in database
//       await client.models.ShoppingCart.update({
//         id: currentCart.id,
//         subtotal,
//         estimatedTax,
//         estimatedShipping,
//         estimatedTotal
//       });

//       // Update local cart state
//       setCart((prevCart: any) => prevCart ? {
//         ...prevCart,
//         subtotal,
//         estimatedTax,
//         estimatedShipping,
//         estimatedTotal
//       } : null);

//       console.log('✅ Item added to cart successfully, new subtotal:', subtotal);
//     } catch (error) {
//       console.error('Error adding item to cart:', error);
//       throw error;
//     }
//   };

//   // Update cart totals helper - calculates from local state and updates both DB and local state
//   const updateCartTotalsLocally = useCallback(async (cartId: string) => {
//     try {
//       // Calculate totals from current local items state
//       const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
//       const estimatedTax = subtotal * 0.18; // 18% GST
//       const estimatedShipping = subtotal > 2000 ? 0 : 100;
//       const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

//       // Update database
//       const client = await getClient();
//       await client.models.ShoppingCart.update({
//         id: cartId,
//         subtotal,
//         estimatedTax,
//         estimatedShipping,
//         estimatedTotal
//       });

//       // Update local cart state
//       setCart((prevCart: any) => prevCart ? {
//         ...prevCart,
//         subtotal,
//         estimatedTax,
//         estimatedShipping,
//         estimatedTotal
//       } : null);
//     } catch (error) {
//       console.error('Error updating cart totals:', error);
//     }
//   }, [items]);

//   // Remove item from cart
//   const removeItem = async (itemId: string) => {
//     console.log('🗑️ Attempting to remove item:', itemId);
    
//     try {
//       // Find item in local state
//       const itemToRemove = items.find(item => item.id === itemId);
      
//       if (!itemToRemove) {
//         console.error('❌ Item not found in local state:', itemId);
//         return;
//       }

//       console.log('🗑️ Found item to remove:', itemToRemove);
      
//       // Remove from database
//       console.log('🗑️ Deleting from database...');
//       const client = await getClient();
//       const deleteResult = await client.models.CartItem.delete({ id: itemId });
//       console.log('🗑️ Delete result:', deleteResult);
      
//       if (deleteResult.errors && deleteResult.errors.length > 0) {
//         console.error('❌ Database delete errors:', deleteResult.errors);
//         throw new Error(`Failed to delete item: ${deleteResult.errors[0].message}`);
//       }
      
//       // Update local state
//       console.log('🗑️ Updating local state...');
//       const newItems = items.filter(item => item.id !== itemId);
//       console.log('🗑️ Items before:', items.length, 'Items after:', newItems.length);
//       setItems(newItems);
      
//       // Calculate totals from the updated items array
//       const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
//       const estimatedTax = subtotal * 0.18; // 18% GST
//       const estimatedShipping = subtotal > 2000 ? 0 : 100;
//       const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

//       console.log('🗑️ New totals:', { subtotal, estimatedTax, estimatedShipping, estimatedTotal });

//       // Update cart in database
//       if (cart) {
//         console.log('🗑️ Updating cart totals in database...');
//         const client = await getClient();
//         const cartUpdateResult = await client.models.ShoppingCart.update({
//           id: cart.id,
//           subtotal,
//           estimatedTax,
//           estimatedShipping,
//           estimatedTotal
//         });
        
//         if (cartUpdateResult.errors && cartUpdateResult.errors.length > 0) {
//           console.error('❌ Cart update errors:', cartUpdateResult.errors);
//         }

//         // Update local cart state
//         setCart((prevCart: any) => prevCart ? {
//           ...prevCart,
//           subtotal,
//           estimatedTax,
//           estimatedShipping,
//           estimatedTotal
//         } : null);
        
//         console.log('✅ Item removed successfully');
//       }
//     } catch (error) {
//       console.error('❌ Error removing item from cart:', error);
//       throw error;
//     }
//   };

//   // Update item quantity
//   const updateQuantity = async (itemId: string, quantity: number) => {
//     if (quantity <= 0) {
//       await removeItem(itemId);
//       return;
//     }

//     try {
//       // Find item in local state
//       const itemIndex = items.findIndex(item => item.id === itemId);
      
//       if (itemIndex >= 0) {
//         const item = items[itemIndex];
        
//         // Get current product price to ensure we're using the latest price
//         let currentUnitPrice = item.unitPrice;
//         try {
//           const { ProductService } = await import('@/lib/services/product-service');
//           const currentProduct = await ProductService.getProductById(item.productId);
//           if (currentProduct && Math.abs(currentProduct.price - item.unitPrice) > 0.01) {
//             console.log(`💰 Price sync: Item ${itemId} price updated from ₹${item.unitPrice} to ₹${currentProduct.price}`);
//             currentUnitPrice = currentProduct.price;
//           }
//         } catch (error) {
//           console.warn('Could not fetch current product price, using stored price:', error);
//         }
        
//         const newTotalPrice = quantity * currentUnitPrice;
        
//         // Update database with current price
//         const client = await getClient();
//         await client.models.CartItem.update({
//           id: itemId,
//           quantity,
//           unitPrice: currentUnitPrice,
//           totalPrice: newTotalPrice
//         });
        
//         // Update local state
//         const newItems = [...items];
//         newItems[itemIndex] = { ...item, quantity, unitPrice: currentUnitPrice, totalPrice: newTotalPrice };
//         setItems(newItems);
        
//         // Calculate totals from the updated items array (not the state which might be stale)
//         const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
//         const estimatedTax = subtotal * 0.18; // 18% GST
//         const estimatedShipping = subtotal > 2000 ? 0 : 100;
//         const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

//         // Update cart in database
//         if (cart) {
//           const client = await getClient();
//           await client.models.ShoppingCart.update({
//             id: cart.id,
//             subtotal,
//             estimatedTax,
//             estimatedShipping,
//             estimatedTotal
//           });

//           // Update local cart state
//           setCart((prevCart: any) => prevCart ? {
//             ...prevCart,
//             subtotal,
//             estimatedTax,
//             estimatedShipping,
//             estimatedTotal
//           } : null);
//         }
//       }
//     } catch (error) {
//       console.error('Error updating item quantity:', error);
//       throw error;
//     }
//   };

//   // Clear cart
//   const clearCart = async () => {
//     if (!cart) return;

//     try {
//       // Delete all items from database
//       const client = await getClient();
//       const deletePromises = items.map(item =>
//         client.models.CartItem.delete({ id: item.id })
//       );
      
//       await Promise.all(deletePromises);
      
//       // Update local state
//       setItems([]);
      
//       // Update cart totals locally
//       await updateCartTotalsLocally(cart.id);
//     } catch (error) {
//       console.error('Error clearing cart:', error);
//       throw error;
//     }
//   };

//   // Refresh cart
//   const refreshCart = async () => {
//     await loadCart();
//   };

//   // Sync cart item prices with current product prices
//   const syncPrices = async () => {
//     if (!items.length) return;

//     try {
//       // Import ProductService dynamically to avoid circular dependency
//       const { ProductService } = await import('@/lib/services/product-service');
      
//       // Get unique product IDs from cart items
//       const productIds = [...new Set(items.map(item => item.productId))];
      
//       // Fetch current product prices
//       const products = await ProductService.getProductsByIds(productIds);
//       const productPriceMap = new Map(products.map(p => [p.id, p.price]));

//       // Update items with price mismatches
//       let hasUpdates = false;
//       const updatedItems = [];
      
//       for (const item of items) {
//         const currentPrice = productPriceMap.get(item.productId);
        
//         if (currentPrice && currentPrice !== item.unitPrice) {
//           const newTotalPrice = item.quantity * currentPrice;
          
//           // Update in database
//           const client = await getClient();
//           await client.models.CartItem.update({
//             id: item.id,
//             unitPrice: currentPrice,
//             totalPrice: newTotalPrice
//           });
          
//           // Update local state immediately
//           updatedItems.push({
//             ...item,
//             unitPrice: currentPrice,
//             totalPrice: newTotalPrice
//           });
          
//           hasUpdates = true;
//           console.log(`Updated cart item ${item.id}: ₹${item.unitPrice} → ₹${currentPrice}`);
//         } else {
//           updatedItems.push(item);
//         }
//       }

//       // Update local items state immediately if there were changes
//       if (hasUpdates) {
//         setItems(updatedItems);
        
//         // Recalculate cart totals with updated items
//         const subtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
//         const estimatedTax = subtotal * 0.18;
//         const estimatedShipping = subtotal > 2000 ? 0 : 100;
//         const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

//         // Update cart in database
//         if (cart) {
//           const client = await getClient();
//           await client.models.ShoppingCart.update({
//             id: cart.id,
//             subtotal,
//             estimatedTax,
//             estimatedShipping,
//             estimatedTotal
//           });

//           // Update local cart state
//           setCart((prevCart: any) => prevCart ? {
//             ...prevCart,
//             subtotal,
//             estimatedTax,
//             estimatedShipping,
//             estimatedTotal
//           } : null);
//         }
//       }
//     } catch (error) {
//       console.error('Error syncing cart prices:', error);
//     }
//   };

//   // Recalculate cart totals based on current cart items
//   const recalculateCartTotals = async () => {
//     if (!cart || !items.length) return;

//     try {
//       // Calculate totals from current items
//       const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
//       const estimatedTax = subtotal * 0.18; // 18% GST
//       const estimatedShipping = subtotal > 2000 ? 0 : 100;
//       const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

//       console.log('Recalculating cart totals:', {
//         oldSubtotal: cart.subtotal,
//         newSubtotal: subtotal,
//         estimatedTax,
//         estimatedShipping,
//         estimatedTotal
//       });

//       // Update cart in database
//       const client = await getClient();
//       await client.models.ShoppingCart.update({
//         id: cart.id,
//         subtotal,
//         estimatedTax,
//         estimatedShipping,
//         estimatedTotal
//       });

//       // Update local cart state
//       setCart((prevCart: any) => prevCart ? {
//         ...prevCart,
//         subtotal,
//         estimatedTax,
//         estimatedShipping,
//         estimatedTotal
//       } : null);

//       console.log('Cart totals recalculated successfully');
//     } catch (error) {
//       console.error('Error recalculating cart totals:', error);
//     }
//   };

//   // Calculate derived values
//   const itemCount = items.reduce((total, item) => total + item.quantity, 0);
//   const totalAmount = cart?.estimatedTotal || 0;

//   const value: CartContextType = {
//     cart,
//     items,
//     isLoading,
//     itemCount,
//     totalAmount,
//     addItem,
//     removeItem,
//     updateQuantity,
//     clearCart,
//     refreshCart,
//     syncPrices,
//     recalculateCartTotals,
//   };

//   return (
//     <CartContext.Provider value={value}>
//       {children}
//     </CartContext.Provider>
//   );
// }