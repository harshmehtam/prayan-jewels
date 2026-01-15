'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { clearCartAction } from '@/app/actions/cart-actions';
import { RazorpayService } from '@/lib/services/razorpay';
import type { Address, ShoppingCart, CartItem } from '@/types';

interface PaymentButtonProps {
  shippingAddress: Partial<Address>;
  billingAddress: Partial<Address>;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
  onSuccess: (orderId: string, paymentId: string, confirmationNumber?: string, paymentMethod?: string) => void;
  onError: (error: string) => void;
  selectedPaymentMethod: 'razorpay' | 'cash_on_delivery';
  appliedCoupon?: {
    id: string;
    code: string;
    name: string;
    discountAmount: number;
  } | null;
  finalTotal: number;
  cart: ShoppingCart;
  items: CartItem[];
}

export function PaymentButton({
  shippingAddress,
  billingAddress,
  isProcessing,
  onProcessingChange,
  onSuccess,
  onError,
  selectedPaymentMethod,
  appliedCoupon,
  finalTotal,
  cart,
  items,
}: PaymentButtonProps) {
  const { user } = useUser();
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!cart || !items.length || !shippingAddress || !billingAddress) {
      onError('Missing required information for payment');
      return;
    }

    setPaymentError(null);
    onProcessingChange(true);

    try {
      // Get customer information
      const customerName = user 
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userId
        : `${shippingAddress.firstName} ${shippingAddress.lastName}`;
      
      // Get customer email - it should always be in the shipping address
      const customerEmail = (shippingAddress as any).email;
      
      if (!customerEmail) {
        throw new Error('Email address is required for order placement');
      }
      
      // Get customer phone - it should be in the shipping address
      const customerPhone = (shippingAddress as any).phone || '';

      console.log('✅ Using customer email from shipping address:', customerEmail);
      console.log('✅ Using customer phone from shipping address:', customerPhone);

      // Create unique customer ID for guest users
      // For guests, use email + phone hash to create a unique but consistent ID
      const guestCustomerId = user?.userId || `guest_${btoa(customerEmail + '_' + customerPhone).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
      
      // Create order data
      const orderData = {
        customerId: guestCustomerId,
        customerEmail,
        customerPhone,
        items,
        shippingAddress,
        billingAddress,
        paymentMethod: selectedPaymentMethod,
        subtotal: cart.subtotal,
        tax: cart.estimatedTax,
        shipping: cart.estimatedShipping,
        couponId: appliedCoupon?.id,
        couponCode: appliedCoupon?.code,
        couponDiscount: appliedCoupon?.discountAmount || 0,
        totalAmount: finalTotal,
      };

      if (selectedPaymentMethod === 'cash_on_delivery') {
        // Handle Cash on Delivery via API route
        console.log('📦 Creating COD order via API...');
        
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        const orderResult = await response.json();
        
        if (!orderResult.success) {
          throw new Error(orderResult.error || 'Failed to create order');
        }

        console.log('✅ COD Order created successfully:', orderResult.orderId, orderResult.confirmationNumber);
        
        await clearCartAction();
        onSuccess(orderResult.orderId!, 'COD_' + Date.now(), orderResult.confirmationNumber, 'cash_on_delivery');
        
        console.log('🧹 Cart cleared after successful COD order');
      } else {
        // Handle Razorpay payment using existing service
        const razorpayService = RazorpayService.getInstance();
        
        // Prepare order data for Razorpay service
        const razorpayOrderData = {
          customerId: guestCustomerId,
          customerEmail,
          customerPhone,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          shippingAddress: {
            firstName: shippingAddress.firstName!,
            lastName: shippingAddress.lastName!,
            addressLine1: shippingAddress.addressLine1!,
            addressLine2: shippingAddress.addressLine2,
            city: shippingAddress.city!,
            state: shippingAddress.state!,
            postalCode: shippingAddress.postalCode!,
            country: shippingAddress.country!,
            isDefault: false,
          },
          billingAddress: {
            firstName: billingAddress.firstName!,
            lastName: billingAddress.lastName!,
            addressLine1: billingAddress.addressLine1!,
            addressLine2: billingAddress.addressLine2,
            city: billingAddress.city!,
            state: billingAddress.state!,
            postalCode: billingAddress.postalCode!,
            country: billingAddress.country!,
            isDefault: false,
          },
        };

        // Open Razorpay checkout
        await razorpayService.openCheckout({
          orderData: razorpayOrderData,
          customerName,
          customerEmail,
          customerPhone,
          onSuccess: async (orderId: string, paymentId: string, confirmationNumber?: string) => {
            try {
              await clearCartAction();
              onSuccess(orderId, paymentId, confirmationNumber, 'razorpay');
            } catch (error) {
              onError('Payment successful but failed to complete order. Please contact support.');
            } finally {
              onProcessingChange(false);
            }
          },
          onError: (error) => {
            console.error('Payment error:', error);
            setPaymentError(error.message);
            onError(error.message);
            onProcessingChange(false);
          },
          onDismiss: () => {
            console.log('Razorpay modal dismissed/cancelled by user');
            setPaymentError(null); // Clear any previous errors
            onProcessingChange(false); // Reset loading state
          },
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      setPaymentError(errorMessage);
      onError(errorMessage);
      onProcessingChange(false);
    }
  };

  return (
    <div className="space-y-4">
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{paymentError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-black text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            {selectedPaymentMethod === 'cash_on_delivery' ? 'Placing Order...' : 'Processing Payment...'}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {selectedPaymentMethod === 'cash_on_delivery' ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Place Order (Cash on Delivery)
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pay Securely with Razorpay
              </>
            )}
          </div>
        )}
      </button>

      {selectedPaymentMethod === 'razorpay' && (
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Secure payment powered by Razorpay</p>
          <p>We accept Credit Cards, Debit Cards, Net Banking, UPI & Wallets</p>
          <div className="flex justify-center items-center space-x-2 mt-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">256-bit SSL Encrypted</span>
          </div>
        </div>
      )}

      {selectedPaymentMethod === 'cash_on_delivery' && (
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Pay cash when your order is delivered to your doorstep</p>
          <p>No additional charges for Cash on Delivery</p>
        </div>
      )}
    </div>
  );
}