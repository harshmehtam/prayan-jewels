'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/amplify-client';
import { useCart } from '@/components/providers/cart-provider';

export function CartSummary() {
  const { cart, itemCount } = useCart();

  if (!cart || itemCount === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Order Summary
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="text-gray-900">
            {formatCurrency(cart.subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Estimated Tax (GST 18%)</span>
          <span className="text-gray-900">
            {formatCurrency(cart.estimatedTax)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-gray-900">
            {cart.estimatedShipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatCurrency(cart.estimatedShipping)
            )}
          </span>
        </div>

        {cart.subtotal < 2000 && cart.estimatedShipping > 0 && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            Add {formatCurrency(2000 - cart.subtotal)} more for free shipping
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">
              {formatCurrency(cart.estimatedTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href="/checkout"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
        >
          Proceed to Checkout
        </Link>
        
        <Link
          href="/products"
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Secure checkout with SSL encryption</p>
        <p className="mt-1">Free returns within 30 days</p>
      </div>
    </div>
  );
}