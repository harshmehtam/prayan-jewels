'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import CachedAmplifyImage from '@/components/ui/CachedAmplifyImage';
import { calculatePriceInfo, formatPrice } from '@/lib/utils/price-utils';
import type { CartItem, ShoppingCart } from '@/types';
import {
  getCart,
  updateCartQuantity,
  removeFromCart
} from '@/app/actions/cart-actions';

// Type for cart with enriched items (returned from getCart action)
type CartWithItems = ShoppingCart & {
  items: CartItem[];
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Cart Item Component
function CartItemComponent({
  item,
  isUpdating,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  isUpdating: boolean;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const priceInfo = calculatePriceInfo(item.unitPrice, item.product?.actualPrice);

  return (
    <div className="flex gap-4">
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
              {item.product?.name}
            </h3>
            {/* <div className="flex items-center mt-1">
              <span className="text-sm text-green-600 font-medium">In Stock</span>
            </div> */}
          </div>
          <button
            onClick={onRemove}
            disabled={isUpdating}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
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
          {/* Price Display */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-gray-900">
                {formatPrice(priceInfo.sellingPrice)}
              </span>
              {priceInfo.hasDiscount && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(priceInfo.actualPrice!)}
                  </span>
                  <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded font-medium">
                    {priceInfo.discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
            {priceInfo.hasDiscount && (
              <span className="text-xs text-black">
                Save ₹{priceInfo.discountAmount.toLocaleString()} per item
              </span>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              {isUpdating ? (
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
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              disabled={isUpdating}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              {isUpdating ? (
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
  );
}

// Empty Cart Component
function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
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
  );
}

// Loading Component
function LoadingCart() {
  return (
    <div className="p-6 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      <p className="text-gray-600 mt-2">Loading cart...</p>
    </div>
  );
}

// Cart Summary Component
function CartSummary({
  itemCount,
  subtotal,
  estimatedTax,
  estimatedTotal,
}: {
  itemCount: number;
  subtotal: number;
  estimatedTax: number;
  estimatedTotal: number;
}) {
  return (
    <>
      <div className="px-6 py-4 space-y-3 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Estimated Tax (GST 18%)</span>
          <span className="text-gray-900">₹{estimatedTax.toFixed(2)}</span>
        </div>
      </div>
      <div className="p-6 border-t border-gray-200">
        <div className="flex justify-between text-lg font-semibold mb-4">
          <span>Total</span>
          <span>₹{estimatedTotal.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}

// Main Cart Modal Component
export function CartModal({ isOpen, onClose }: CartModalProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Load cart data
  const loadCart = async () => {
    setIsLoading(true);
    const cartData = await getCart();
    setCart(cartData);
    setIsLoading(false);
  };

  // Load cart when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (updatingItems.has(itemId)) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));

    startTransition(async () => {
      try {
        const result = await updateCartQuantity(itemId, newQuantity);

        if (result.success) {
          // Reload cart data
          await loadCart();
        } else {
          console.error('Error updating quantity:', result.error);
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
      } finally {
        setUpdatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    if (updatingItems.has(itemId)) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));

    startTransition(async () => {
      try {
        const result = await removeFromCart(itemId);

        if (result.success) {
          // Reload cart data
          await loadCart();
        } else {
          console.error('Error removing item:', result.error);
        }
      } catch (error) {
        console.error('Error removing item:', error);
      } finally {
        setUpdatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    });
  };

  const handleContinueToCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const items = cart?.items || [];
  const itemCount = items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  const subtotal = cart?.subtotal || 0;
  const estimatedTax = cart?.estimatedTax || 0;
  const estimatedTotal = cart?.estimatedTotal || 0;

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
          {/* Scrollable Cart Items Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading State */}
            {isLoading && <LoadingCart />}

            {/* Empty Cart State */}
            {!isLoading && items.length === 0 && (
              <EmptyCart onClose={onClose} />
            )}

            {/* Cart Items */}
            {!isLoading && items.length > 0 && (
              <div className="p-6 space-y-6">
                {items.map((item) => (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    isUpdating={updatingItems.has(item.id) || isPending}
                    onUpdateQuantity={(qty) => handleUpdateQuantity(item.id, qty)}
                    onRemove={() => handleRemoveItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Fixed Bottom Section */}
          {!isLoading && items.length > 0 && (
            <>
              <CartSummary
                itemCount={itemCount}
                subtotal={subtotal}
                estimatedTax={estimatedTax}
                estimatedTotal={estimatedTotal}
              />
              <div className="px-6 pb-6">
                <button
                  onClick={handleContinueToCheckout}
                  disabled={isPending}
                  className="w-full bg-black text-white py-4 text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  CONTINUE TO CHECKOUT
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}