'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/providers/cart-provider';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { BillingForm } from '@/components/checkout/BillingForm';
import { OrderReview } from '@/components/checkout/OrderReview';
import CheckoutHeader from '@/components/layout/CheckoutHeader';
import PageLoading from '@/components/ui/PageLoading';
import CachedAmplifyImage from '@/components/ui/CachedAmplifyImage';
import { ProductService } from '@/lib/services/product-service';
import type { Address, Product } from '@/types';
import type { SavedAddress } from '@/lib/services/address-service';

export type CheckoutStep = 'shipping' | 'billing' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, items, isLoading: cartLoading, itemCount } = useCart();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingAddress, setShippingAddress] = useState<Partial<Address> | null>(null);
  const [billingAddress, setBillingAddress] = useState<Partial<Address> | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [editingShippingAddress, setEditingShippingAddress] = useState<SavedAddress | null>(null);
  const [editingBillingAddress, setEditingBillingAddress] = useState<SavedAddress | null>(null);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    name: string;
    discountAmount: number;
  } | null>(null);
  const [finalTotal, setFinalTotal] = useState(0);
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    orderId?: string;
    confirmationNumber?: string;
    error?: string;
    paymentMethod?: string;
  } | null>(null);

  // Update final total when cart or coupon changes
  useEffect(() => {
    if (cart) {
      const discount = appliedCoupon?.discountAmount || 0;
      setFinalTotal(cart.estimatedTotal - discount);
    }
  }, [cart, appliedCoupon]);

  // Load product details for cart items
  useEffect(() => {
    const loadProducts = async () => {
      if (!items.length) {
        setIsLoadingProducts(false);
        return;
      }

      try {
        const productIds = [...new Set(items.map(item => item.productId))];
        const productList = await ProductService.getProductsByIds(productIds);
        
        const productMap = new Map<string, Product>();
        productList.forEach(product => {
          productMap.set(product.id, product);
        });
        
        setProducts(productMap);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [items]);

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

  if (cartLoading) {
    return <PageLoading />;
  }

  // Show order result when cart is empty (after order attempt)
  if ((!cart || itemCount === 0) && orderResult) {
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

              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Order Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderResult.confirmationNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Confirmation Number</p>
                      <p className="font-semibold text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded border">
                        {orderResult.confirmationNumber}
                      </p>
                    </div>
                  )}
                  
                  {orderResult.orderId && (
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-semibold text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded border">
                        {orderResult.orderId}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      {orderResult.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-semibold text-gray-900">
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

              {/* What's Next */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What happens next?</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">1</span>
                    </div>
                    <p>You'll receive an order confirmation email shortly</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">2</span>
                    </div>
                    <p>Your order will be processed within 1-2 business days</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">3</span>
                    </div>
                    <p>You'll receive tracking information once your order ships</p>
                  </div>
                  {/* {orderResult.paymentMethod === 'cash_on_delivery' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-xs">4</span>
                      </div>
                      <p>Please keep the exact amount ready for cash on delivery</p>
                    </div>
                  )} */}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <a 
                  href="/products" 
                  className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block"
                >
                  Continue Shopping
                </a>
                {/* <a 
                  href="/" 
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-block"
                >
                  Back to Homepage
                </a> */}
              </div>

              {/* Support Information */}
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
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Order Failed
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                We're sorry, but there was an issue processing your order.
              </p>

              {/* Error Details */}
              <div className="bg-red-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">Error Details</h3>
                <p className="text-sm text-red-700 bg-white px-4 py-3 rounded border border-red-200">
                  {orderResult.error || 'An unexpected error occurred while processing your order.'}
                </p>
              </div>

              {/* What to do next */}
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

              {/* Action Buttons */}
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
                {/* <a 
                  href="/" 
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors inline-block"
                >
                  Back to Homepage
                </a> */}
              </div>

              {/* Support Information */}
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
  if (!cart || itemCount === 0) {
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
    setEditingShippingAddress(null); // Clear editing state
    if (sameAsShipping) {
      // Copy shipping address to billing address, preserving email and phone
      const billingAddr = {
        ...address,
        type: 'billing' as const,
        // Preserve email and phone from shipping address
        email: (address as any).email,
        phone: (address as any).phone,
      };
      setBillingAddress(billingAddr);
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
      // Copy shipping address to billing address, preserving email and phone
      setBillingAddress({
        ...shippingAddress,
        type: 'billing',
        // Preserve email and phone from shipping address
        email: (shippingAddress as any).email,
        phone: (shippingAddress as any).phone,
      });
    } else {
      // Clear billing address when unchecked
      setBillingAddress(null);
    }
  };

  const handleBillingSubmit = (address: Partial<Address>) => {
    setBillingAddress(address);
    setEditingBillingAddress(null); // Clear editing state
    setCurrentStep('review');
  };

  const handleBackToShipping = () => {
    setCurrentStep('shipping');
    // If we have shipping address data, we want to show the form directly
    // This ensures that when user navigates back, they see their entered data
    if (shippingAddress) {
      setEditingShippingAddress(null); // Clear any editing state
    }
  };

  const handleBackToBilling = () => {
    setCurrentStep('billing');
  };

  const handlePlaceOrder = async () => {
    // This is now handled by the PaymentButton component
    console.log('Order placement handled by PaymentButton component');
  };

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

  if (cartLoading || isLoadingProducts) {
    return <PageLoading />;
  }

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
            
            {/* Back button for review step */}
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
                  editingAddress={editingShippingAddress}
                />
              )}
              
              {currentStep === 'billing' && (
                <BillingForm
                  onSubmit={handleBillingSubmit}
                  onBack={handleBackToShipping}
                  initialData={billingAddress}
                  editingAddress={editingBillingAddress}
                />
              )}
              
              {currentStep === 'review' && (
                <OrderReview
                  cart={cart}
                  items={items}
                  shippingAddress={shippingAddress!}
                  billingAddress={billingAddress!}
                  onPlaceOrder={handlePlaceOrder}
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
                  const product = products.get(item.productId);
                  
                  return (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                        {product?.images?.[0] ? (
                          <CachedAmplifyImage
                            path={product.images[0]}
                            alt={product.name}
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
                          {product?.name || `Product ${item.productId}`}
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