'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { BillingForm } from '@/components/checkout/BillingForm';
import { OrderReview } from '@/components/checkout/OrderReview';
import CheckoutHeader from '@/components/layout/CheckoutHeader';
import PageLoading from '@/components/ui/PageLoading';
import type { Address } from '@/types';

export type CheckoutStep = 'shipping' | 'billing' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, items, isLoading: cartLoading, itemCount } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<Partial<Address> | null>(null);
  const [billingAddress, setBillingAddress] = useState<Partial<Address> | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Prevent accidental navigation away from checkout
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep !== 'shipping' || shippingAddress) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, shippingAddress]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && (!cart || itemCount === 0)) {
      router.push('/');
    }
  }, [cart, itemCount, cartLoading, router]);

  if (cartLoading) {
    return <PageLoading />;
  }

  if (!cart || itemCount === 0) {
    return null;
  }

  const handleShippingSubmit = (address: Partial<Address>) => {
    setShippingAddress(address);
    if (sameAsShipping) {
      // Copy shipping address to billing address
      setBillingAddress({
        ...address,
        type: 'billing'
      });
      setCurrentStep('review');
    } else {
      // Clear billing address and go to billing step
      setBillingAddress(null);
      setCurrentStep('billing');
    }
  };

  const handleSameAsShippingChange = (same: boolean) => {
    setSameAsShipping(same);
    if (same && shippingAddress) {
      // Copy shipping address to billing address
      setBillingAddress({
        ...shippingAddress,
        type: 'billing'
      });
    } else {
      // Clear billing address when unchecked
      setBillingAddress(null);
    }
  };

  const handleBillingSubmit = (address: Partial<Address>) => {
    setBillingAddress(address);
    setCurrentStep('review');
  };

  const handleBackToShipping = () => {
    setCurrentStep('shipping');
  };

  const handleBackToBilling = () => {
    setCurrentStep('billing');
  };

  const handlePlaceOrder = async () => {
    // This is now handled by the PaymentButton component
    // The actual order creation and payment processing happens in the Razorpay flow
    console.log('Order placement handled by PaymentButton component');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Checkout Header */}
      <CheckoutHeader />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">
            Complete your purchase of {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
          {/* <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                No account required! Simply provide your shipping information to complete your order.
              </p>
            </div>
          </div> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main checkout form */}
          <div className="lg:col-span-2">
            <CheckoutSteps currentStep={currentStep} />
            
            <div className="mt-8">
              {currentStep === 'shipping' && (
                <ShippingForm
                  onSubmit={handleShippingSubmit}
                  sameAsShipping={sameAsShipping}
                  onSameAsShippingChange={handleSameAsShippingChange}
                  initialData={shippingAddress}
                />
              )}
              
              {currentStep === 'billing' && (
                <BillingForm
                  onSubmit={handleBillingSubmit}
                  onBack={handleBackToShipping}
                  initialData={billingAddress}
                />
              )}
              
              {currentStep === 'review' && (
                <OrderReview
                  cart={cart}
                  items={items}
                  shippingAddress={shippingAddress!}
                  billingAddress={billingAddress!}
                  onBack={sameAsShipping ? handleBackToShipping : handleBackToBilling}
                  onPlaceOrder={handlePlaceOrder}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-4">
                {items.map((item, index) => {
                  // Mock product names for UI development
                  const productNames = [
                    'Fine Chain Necklace 22"',
                    'December Birthstone Locket',
                    'Silver Chain Bracelet'
                  ];
                  
                  return (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {productNames[index] || `Product ${item.productId}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ₹{item.totalPrice.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

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

              <div className="mt-6 text-xs text-gray-500 text-center">
                <p>Secure checkout with SSL encryption</p>
                <p className="mt-1">Free returns within 30 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}