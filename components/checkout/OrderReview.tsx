'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/components/providers/cart-provider';
import { PaymentButton } from './PaymentButton';
import type { ShoppingCart, CartItem, Address } from '@/types';

interface OrderReviewProps {
  cart: ShoppingCart;
  items: CartItem[];
  shippingAddress: Partial<Address>;
  billingAddress: Partial<Address>;
  onBack: () => void;
  onPlaceOrder: () => Promise<void>;
  isProcessing: boolean;
}

export function OrderReview({
  cart,
  items,
  shippingAddress,
  billingAddress,
  onBack,
  onPlaceOrder,
  isProcessing
}: OrderReviewProps) {
  const { validateInventory } = useCart();
  const [inventoryValidation, setInventoryValidation] = useState<{
    isValid: boolean;
    unavailableItems: any[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Validate inventory when component mounts
  useEffect(() => {
    const checkInventory = async () => {
      try {
        const validation = await validateInventory();
        setInventoryValidation(validation);
      } catch (error) {
        console.error('Error validating inventory:', error);
        setInventoryValidation({ isValid: false, unavailableItems: [] });
      } finally {
        setIsValidating(false);
      }
    };

    checkInventory();
  }, [validateInventory]);

  const formatAddress = (address: Partial<Address>) => {
    const parts = [
      `${address.firstName} ${address.lastName}`,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country
    ].filter(Boolean);
    
    return parts.join('\n');
  };

  const handlePlaceOrder = async () => {
    // Final inventory check before placing order
    const finalValidation = await validateInventory();
    if (!finalValidation.isValid) {
      setInventoryValidation(finalValidation);
      return;
    }

    await onPlaceOrder();
  };

  const handlePaymentSuccess = (orderId: string, paymentId: string) => {
    console.log('Payment successful:', { orderId, paymentId });
    setPaymentError(null);
    // The PaymentButton component handles navigation to order confirmation
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setPaymentError(error);
  };

  if (isValidating) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Validating order...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory validation errors */}
      {inventoryValidation && !inventoryValidation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Some items are no longer available
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please remove the unavailable items from your cart and try again.</p>
                {inventoryValidation.unavailableItems.length > 0 && (
                  <ul className="mt-2 list-disc list-inside">
                    {inventoryValidation.unavailableItems.map((item, index) => (
                      <li key={index}>Product {item.productId}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
        
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md"></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900">
                  Product {item.productId}
                </h3>
                <p className="text-sm text-gray-500">
                  Quantity: {item.quantity}
                </p>
                <p className="text-sm text-gray-500">
                  Unit Price: ₹{item.unitPrice.toLocaleString()}
                </p>
              </div>
              <div className="text-sm font-medium text-gray-900">
                ₹{item.totalPrice.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Order totals */}
        <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">₹{cart.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (GST 18%)</span>
            <span className="text-gray-900">₹{cart.estimatedTax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">
              {cart.estimatedShipping === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                `₹${cart.estimatedShipping.toLocaleString()}`
              )}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">₹{cart.estimatedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
        <div className="text-sm text-gray-700 whitespace-pre-line">
          {formatAddress(shippingAddress)}
        </div>
      </div>

      {/* Billing Address */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
        <div className="text-sm text-gray-700 whitespace-pre-line">
          {formatAddress(billingAddress)}
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">RAZORPAY</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Razorpay Secure Payment</p>
            <p className="text-xs text-gray-500">
              Credit Card, Debit Card, Net Banking, UPI, Wallets
            </p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <p>Your payment information will be processed securely by Razorpay.</p>
          <p>We do not store your payment details on our servers.</p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <input
            id="terms"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500 underline">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </a>
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing || paymentProcessing}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        
        <div className="flex-1 max-w-md ml-4">
          <PaymentButton
            shippingAddress={shippingAddress}
            billingAddress={billingAddress}
            isProcessing={paymentProcessing}
            onProcessingChange={setPaymentProcessing}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    </div>
  );
}