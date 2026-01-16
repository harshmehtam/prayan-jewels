'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCart } from '@/app/actions/cart-actions';
import { getCurrentUser } from '@/app/actions/auth-actions';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { BillingForm } from '@/components/checkout/BillingForm';
import { OrderReview } from '@/components/checkout/OrderReview';
import CheckoutHeader from '@/components/layout/CheckoutHeader';
import PageLoading from '@/components/ui/PageLoading';
import CachedAmplifyImage from '@/components/ui/CachedAmplifyImage';
import { calculatePriceInfo, formatPrice } from '@/lib/utils/price-utils';
import type { Address, CartItem, ShoppingCart } from '@/types';

export type CheckoutStep = 'shipping' | 'billing' | 'review';

type CartWithItems = ShoppingCart & {
  items: CartItem[];
};

type OrderResultState = {
  success: boolean;
  orderId?: string;
  confirmationNumber?: string;
  error?: string;
  paymentMethod?: string;
} | null;

export default function CheckoutPage() {
  const router = useRouter();
  const hasLoadedCart = useRef(false);
  const isLoadingCart = useRef(false); // Prevent concurrent loads
  
  // Cart state - single source of truth (items already include product data)
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  
  // Checkout flow state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<Partial<Address> | null>(null);
  const [billingAddress, setBillingAddress] = useState<Partial<Address> | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    name: string;
    discountAmount: number;
  } | null>(null);
  
  // Order result state
  const [orderResult, setOrderResult] = useState<OrderResultState>(null);

  // Load cart data and user info only once with extra protection
  useEffect(() => {
    // Triple protection against multiple calls
    if (hasLoadedCart.current || isLoadingCart.current) {
      return;
    }

    const loadData = async () => {
      isLoadingCart.current = true;
      
      try {
        console.log('🛒 Loading cart data...');
        setIsLoading(true);
        
        // Load cart and user in parallel
        const [cartData, user] = await Promise.all([
          getCart(),
          getCurrentUser()
        ]);
        
        setCart(cartData);
        setUserId(user?.userId);
        hasLoadedCart.current = true;
        console.log('✅ Cart and user loaded successfully');
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setIsLoading(false);
        isLoadingCart.current = false;
      }
    };

    loadData();
  }, []); // Empty deps - only run once

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

  // Memoize calculated values to prevent unnecessary re-renders
  const finalTotal = useMemo(() => {
    return cart ? cart.estimatedTotal - (appliedCoupon?.discountAmount || 0) : 0;
  }, [cart?.estimatedTotal, appliedCoupon?.discountAmount]);

  const items = useMemo(() => cart?.items || [], [cart?.items]);
  
  const itemCount = useMemo(() => {
    return items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  }, [items]);

  if (isLoading) {
    return <PageLoading />;
  }

  // Show order result when cart is empty (after order completion)
  if ((!cart || items.length === 0) && orderResult) {
    if (orderResult.success) {
      // Success Screen
      return (
        <div className="min-h-screen bg-gray-50">
          <CheckoutHeader />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Order Placed Successfully! 🎉
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Thank you for your order! We've received your order and will process it shortly.
              </p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 mb-8 border border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Order Information</h3>
                
                {orderResult.confirmationNumber && (
                  <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-green-300 mb-6">
                    <p className="text-sm font-medium text-green-700 mb-2 text-center">Confirmation Number</p>
                    <p className="text-2xl font-bold text-green-800 tracking-wider font-mono text-center">
                      {orderResult.confirmationNumber}
                    </p>
                    <p className="text-xs text-green-600 mt-2 text-center">
                      Please save this number for your records
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-600 mb-1">Payment Method</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {orderResult.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm font-medium text-gray-600 mb-1">Order Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date().toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center text-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What happens next?
                </h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                    <p>You'll receive an order confirmation email shortly</p>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                    <p>Your order will be processed within 1-2 business days</p>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                    <p>You'll receive tracking information once your order ships</p>
                  </div>
                  {orderResult.paymentMethod === 'cash_on_delivery' && (
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">💰</span>
                      <p className="font-medium">Please keep the exact amount ready for cash on delivery</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <a 
                  href="/products" 
                  className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block"
                >
                  Continue Shopping
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:support@prayanjewels.com" className="text-black hover:text-gray-700 underline">
                      support@prayanjewels.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-500">
                    Please include your Confirmation Number ({orderResult.confirmationNumber}) in your email for faster assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Failure Screen
      return (
        <div className="min-h-screen bg-gray-50">
          <CheckoutHeader />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Failed</h1>
              <p className="text-lg text-gray-600 mb-6">
                We're sorry, but there was an issue processing your order.
              </p>

              <div className="bg-red-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">Error Details</h3>
                <p className="text-sm text-red-700 bg-white px-4 py-3 rounded border border-red-200">
                  {orderResult.error || 'An unexpected error occurred while processing your order.'}
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What can you do?</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold text-xs">1</span>
                    </div>
                    <p>Try placing your order again - the issue might be temporary</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold text-xs">2</span>
                    </div>
                    <p>Check your internet connection and try again</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold text-xs">3</span>
                    </div>
                    <p>Contact our support team if the problem persists</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setOrderResult(null);
                    window.location.reload();
                  }}
                  className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Try Again
                </button>
                <a 
                  href="/products" 
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-block"
                >
                  Continue Shopping
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Need immediate assistance?</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:support@prayanjewels.com" className="text-black hover:text-gray-700 underline">
                      support@prayanjewels.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-500">
                    Please describe the error and what you were trying to do when it occurred
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Show empty cart message if no order result
  if (!cart || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart to continue with checkout.</p>
            <a href="/products" className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleShippingSubmit = (address: Partial<Address>) => {
    setShippingAddress(address);
    if (sameAsShipping) {
      setBillingAddress({
        ...address,
        type: 'billing' as const,
      });
      setCurrentStep('review');
    } else {
      setBillingAddress(null);
      setCurrentStep('billing');
    }
  };

  const handleSameAsShippingChange = (same: boolean) => {
    setSameAsShipping(same);
    if (same && shippingAddress) {
      setBillingAddress({
        ...shippingAddress,
        type: 'billing',
      });
    } else {
      setBillingAddress(null);
    }
  };

  const handleBillingSubmit = (address: Partial<Address>) => {
    setBillingAddress(address);
    setCurrentStep('review');
  };

  const handleBackToShipping = () => setCurrentStep('shipping');
  const handleBackToBilling = () => setCurrentStep('billing');

  const handleOrderSuccess = (orderId: string, paymentId: string, confirmationNumber?: string, paymentMethod?: string) => {
    setOrderResult({
      success: true,
      orderId,
      confirmationNumber,
      paymentMethod: paymentMethod || (paymentId.startsWith('COD_') ? 'cash_on_delivery' : 'razorpay')
    });
  };

  const handleOrderError = (error: string) => {
    setOrderResult({
      success: false,
      error
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">
            Complete your purchase of {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main checkout form */}
          <div className="lg:col-span-2">
            <CheckoutSteps currentStep={currentStep} />
            
            {currentStep === 'review' && (
              <div className="mb-6">
                <button
                  onClick={sameAsShipping ? handleBackToShipping : handleBackToBilling}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {sameAsShipping ? 'Back to Shipping' : 'Back to Billing'}
                </button>
              </div>
            )}
            
            <div className="mt-8">
              {currentStep === 'shipping' && (
                <ShippingForm
                  onSubmit={handleShippingSubmit}
                  sameAsShipping={sameAsShipping}
                  onSameAsShippingChange={handleSameAsShippingChange}
                  initialData={shippingAddress}
                  editingAddress={null}
                />
              )}
              
              {currentStep === 'billing' && (
                <BillingForm
                  onSubmit={handleBillingSubmit}
                  onBack={handleBackToShipping}
                  initialData={billingAddress}
                  editingAddress={null}
                />
              )}
              
              {currentStep === 'review' && (
                <OrderReview
                  cart={cart}
                  items={items}
                  shippingAddress={shippingAddress!}
                  billingAddress={billingAddress!}
                  onPlaceOrder={async () => {}}
                  isProcessing={false}
                  onSuccess={handleOrderSuccess}
                  onError={handleOrderError}
                  appliedCoupon={appliedCoupon}
                  onCouponApplied={(coupon, discountAmount) => {
                    setAppliedCoupon({
                      id: coupon.id,
                      code: coupon.code,
                      name: coupon.name,
                      discountAmount,
                    });
                  }}
                  onCouponRemoved={() => setAppliedCoupon(null)}
                  userId={userId}
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
                {items.map((item) => {
                  const priceInfo = calculatePriceInfo(item.unitPrice, item.product?.actualPrice);
                  
                  return (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                        {item.product?.images?.[0] ? (
                          <CachedAmplifyImage
                            path={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product?.name || `Product ${item.productId}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × {formatPrice(priceInfo.sellingPrice)}
                          </p>
                          {priceInfo.hasDiscount && (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(priceInfo.actualPrice!)}
                              </span>
                              <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded font-medium">
                                {priceInfo.discountPercentage}% OFF
                              </span>
                            </>
                          )}
                        </div>
                        {priceInfo.hasDiscount && (
                          <p className="text-xs text-black">
                            Save ₹{(priceInfo.discountAmount * item.quantity).toLocaleString()} total
                          </p>
                        )}
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
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Coupon Discount ({appliedCoupon.code})</span>
                    <span className="text-green-600">-₹{appliedCoupon.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">₹{finalTotal.toLocaleString()}</span>
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