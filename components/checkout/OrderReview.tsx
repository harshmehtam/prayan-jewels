'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/components/providers/cart-provider';
import { PaymentButton } from './PaymentButton';
import { ProductService } from '@/lib/services/product-service';
import type { ShoppingCart, CartItem, Address, Product } from '@/types';

interface OrderReviewProps {
  cart: ShoppingCart;
  items: CartItem[];
  shippingAddress: Partial<Address>;
  billingAddress: Partial<Address>;
  onPlaceOrder: () => Promise<void>;
  isProcessing: boolean;
  onSuccess?: (orderId: string, paymentId: string, confirmationNumber?: string, paymentMethod?: string) => void;
  onError?: (error: string) => void;
}

export function OrderReview({
  cart,
  items,
  shippingAddress,
  billingAddress,
  onPlaceOrder,
  onSuccess,
  onError,
}: OrderReviewProps) {
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'cash_on_delivery'>('razorpay');

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
    await onPlaceOrder();
  };

  const handlePaymentSuccess = (orderId: string, paymentId: string, confirmationNumber?: string, paymentMethod?: string) => {
    console.log('Payment successful:', { orderId, paymentId, confirmationNumber, paymentMethod });
    onSuccess?.(orderId, paymentId, confirmationNumber, paymentMethod);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    onError?.(error);
  };

  if (isLoadingProducts) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading order details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
        
        <div className="space-y-3">
          {/* Razorpay Option */}
          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="razorpay"
              checked={selectedPaymentMethod === 'razorpay'}
              onChange={(e) => setSelectedPaymentMethod(e.target.value as 'razorpay')}
              className="h-4 w-4 text-black focus:ring-black border-gray-300"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Pay Online</p>
                  <p className="text-xs text-gray-500">Credit Card, Debit Card, Net Banking, UPI, Wallets</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-5 bg-black rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">RP</span>
                  </div>
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </label>

          {/* Cash on Delivery Option */}
          <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="paymentMethod"
              value="cash_on_delivery"
              checked={selectedPaymentMethod === 'cash_on_delivery'}
              onChange={(e) => setSelectedPaymentMethod(e.target.value as 'cash_on_delivery')}
              className="h-4 w-4 text-black focus:ring-black border-gray-300"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when your order is delivered</p>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <input
            id="terms"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" className="text-black hover:text-gray-700 underline">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-black hover:text-gray-700 underline">
              Privacy Policy
            </a>
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-6">
        <PaymentButton
          shippingAddress={shippingAddress}
          billingAddress={billingAddress}
          isProcessing={paymentProcessing}
          onProcessingChange={setPaymentProcessing}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          selectedPaymentMethod={selectedPaymentMethod}
        />
      </div>
    </div>
  );
}