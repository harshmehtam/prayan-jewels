'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/components/providers/cart-provider';
import { CartItem, CartSummary } from '@/components/cart';

export default function CartPage() {
  const { cart, items, isLoading, itemCount, clearCart } = useCart();

  if (isLoading) {
    return (
      <div className="pt-52 sm:pt-44 lg:pt-48 pb-4 sm:pb-8">
        <div className="container mx-auto container-mobile">
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || itemCount === 0) {
    return (
      <div className="pt-52 sm:pt-44 lg:pt-48 pb-4 sm:pb-8">
        <div className="container mx-auto container-mobile">
          <h1 className="text-responsive-2xl font-bold text-gray-900 mb-6 sm:mb-8">
            Shopping Cart
          </h1>
          
          {/* Empty Cart State */}
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h2 className="text-responsive-lg font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6 text-responsive-sm">
              Start shopping to add items to your cart
            </p>
            <Link 
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block focus-ring text-responsive-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  return (
    <div className="pt-52 sm:pt-44 lg:pt-48 pb-4 sm:pb-8">
      <div className="container mx-auto container-mobile">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-responsive-2xl font-bold text-gray-900">
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h1>
          
          {itemCount > 0 && (
            <button
              onClick={handleClearCart}
              className="text-responsive-xs text-red-600 hover:text-red-800 transition-colors focus-ring rounded-md px-2 py-1 self-start sm:self-auto"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6">
                <h2 className="text-responsive-base font-semibold text-gray-900 mb-4">
                  Cart Items
                </h2>
                
                <div className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors focus-ring rounded-md px-2 py-1 text-responsive-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <CartSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}