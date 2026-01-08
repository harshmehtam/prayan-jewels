'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/providers/cart-provider';
import { ProductService } from '@/lib/services/product-service';
import CachedAmplifyImage from '@/components/ui/CachedAmplifyImage';
import type { Product } from '@/types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const router = useRouter();
  const { cart, items, isLoading, itemCount, updateQuantity, removeItem, recalculateCartTotals } = useCart();
  const [itemsWithProducts, setItemsWithProducts] = useState<CartItemWithProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set()); // Track which items are being updated
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling on the body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Only fetch product details when modal is opened and has items
  useEffect(() => {
    if (!isOpen) {
      // Clear local state when modal is closed
      setItemsWithProducts([]);
      return;
    }

    if (isLoading) {
      return;
    }

    const fetchProductDetails = async () => {
      setLoadingProducts(true);
      try {
        console.log('🔄 CartModal: Refreshing product details, items count:', items.length);
        
        if (items.length === 0) {
          setItemsWithProducts([]);
          setLoadingProducts(false);
          return;
        }

        // Get unique product IDs from cart items
        const productIds = [...new Set(items.map(item => item.productId))];
        
        // Fetch all products in a single call
        const products = await ProductService.getProductsByIds(productIds);
        
        // Create a map for quick lookup
        const productMap = new Map(products.map(product => [product.id, product]));
        
        // Map cart items with their product details and check for price mismatches
        const itemsWithProductData = items.map(item => ({
          ...item,
          product: productMap.get(item.productId) || undefined
        }));

        // Check for price mismatches and sync if needed
        const priceMismatches = itemsWithProductData.filter(item => 
          item.product && Math.abs(item.product.price - item.unitPrice) > 0.01
        );

        if (priceMismatches.length > 0) {
          console.log('💰 Price mismatches detected, syncing cart prices...', priceMismatches.map(item => ({
            productId: item.productId,
            cartPrice: item.unitPrice,
            currentPrice: item.product?.price
          })));

          // Update each mismatched item with current product price
          for (const item of priceMismatches) {
            if (item.product) {
              try {
                console.log(`💰 Updating item ${item.id}: ₹${item.unitPrice} → ₹${item.product.price}`);
                
                // Update the cart item with current product price
                await updateQuantity(item.id, item.quantity);
                
                // Update the local display immediately
                const updatedItem = {
                  ...item,
                  unitPrice: item.product.price,
                  totalPrice: item.quantity * item.product.price
                };
                
                // Update the local itemsWithProductData array
                const itemIndex = itemsWithProductData.findIndex(i => i.id === item.id);
                if (itemIndex >= 0) {
                  itemsWithProductData[itemIndex] = updatedItem;
                }
              } catch (error) {
                console.error(`❌ Failed to update price for item ${item.id}:`, error);
              }
            }
          }
        }
        
        console.log('🔄 CartModal: Updated itemsWithProducts:', itemsWithProductData.length);
        setItemsWithProducts(itemsWithProductData);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setItemsWithProducts(items.map(item => ({ ...item, product: undefined })));
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductDetails();
  }, [isOpen, items, isLoading, updateQuantity]); // Only run when modal opens or items change

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId);
      return;
    }

    // Prevent multiple simultaneous updates for the same item
    if (updatingItems.has(itemId)) {
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // Prevent multiple simultaneous removals for the same item
    if (updatingItems.has(itemId)) {
      console.log('⚠️ Item removal already in progress:', itemId);
      return;
    }

    console.log('🗑️ CartModal: Starting item removal:', itemId);

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      await removeItem(itemId);
      console.log('✅ CartModal: Item removed successfully:', itemId);
    } catch (error) {
      console.error('❌ CartModal: Error removing item:', error);
      // You could add a toast notification here to inform the user
      alert('Failed to remove item from cart. Please try again.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const subtotal = cart?.subtotal || 0;
  const estimatedTax = cart?.estimatedTax || 0;
  const estimatedTotal = cart?.estimatedTotal || 0;

  const handleContinueToCheckout = () => {
    // Close the modal first
    onClose();
    // Navigate to checkout page
    router.push('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div className="relative mr-3">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">YOUR SHOPPING BAG</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Free delivery message - Remove this section */}
          
          {/* Scrollable Cart Items Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading State */}
            {(isLoading || loadingProducts) && (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading cart...</p>
              </div>
            )}

            {/* Empty Cart State */}
            {!isLoading && !loadingProducts && itemsWithProducts.length === 0 && (
              <div className="p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-4">Add some products to get started</p>
                <button
                  onClick={onClose}
                  className="bg-black text-white px-6 py-2 text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}

            {/* Cart Items */}
            {!isLoading && !loadingProducts && itemsWithProducts.length > 0 && (
              <div className="p-6 space-y-6">
                {itemsWithProducts.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <CachedAmplifyImage 
                          path={item.product.images[0]} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {item.product?.name || `Product ID: ${item.productId}`}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-green-600 font-medium">In Stock</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingItems.has(item.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingItems.has(item.id) ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-gray-900">₹{item.unitPrice}</span>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updatingItems.has(item.id) || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            {updatingItems.has(item.id) ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            )}
                          </button>
                          <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            {updatingItems.has(item.id) ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed Bottom Section */}
          {!isLoading && !loadingProducts && itemsWithProducts.length > 0 && (
            <div className="flex-shrink-0 border-t border-gray-200">
              {/* Order Summary */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                  <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Tax (GST 18%)</span>
                  <span className="text-gray-900">₹{estimatedTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Estimated Total and Checkout Button */}
        {!isLoading && !loadingProducts && itemsWithProducts.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex-shrink-0">
            {/* Estimated Total */}
            <div className="flex justify-between text-lg font-semibold mb-4">
              <span>Total</span>
              <span>₹{estimatedTotal.toFixed(2)}</span>
            </div>
            
            {/* Checkout Button */}
            <button 
              onClick={handleContinueToCheckout}
              className="w-full bg-black text-white py-4 text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              CONTINUE TO CHECKOUT
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}