'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';
import { RazorpayService } from '@/lib/services/razorpay';
import type { Address, CreateOrderInput } from '@/types';

interface PaymentButtonProps {
  shippingAddress: Partial<Address>;
  billingAddress: Partial<Address>;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
  onSuccess: (orderId: string, paymentId: string) => void;
  onError: (error: string) => void;
}

export function PaymentButton({
  shippingAddress,
  billingAddress,
  isProcessing,
  onProcessingChange,
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { cart, items, clearCart } = useCart();
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const razorpayService = RazorpayService.getInstance();

  const handlePayment = async () => {
    if (!user || !userProfile || !cart || !items.length || !shippingAddress || !billingAddress) {
      onError('Missing required information for payment');
      return;
    }

    setPaymentError(null);
    onProcessingChange(true);

    try {
      // Prepare order data
      const orderData: CreateOrderInput = {
        customerId: user.userId,
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
        orderData,
        customerName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || user.username,
        customerEmail: user.username, // username is the email in mock auth
        customerPhone: userProfile.phone || '',
        onSuccess: async (orderId: string, paymentId: string) => {
          try {
            // Clear the cart after successful payment
            await clearCart();
            
            // Call success handler
            onSuccess(orderId, paymentId);
            
            // Redirect to order confirmation page
            router.push(`/account/orders/${orderId}?payment=success`);
          } catch (error) {
            console.error('Error handling payment success:', error);
            onError('Payment successful but failed to complete order. Please contact support.');
          } finally {
            onProcessingChange(false);
          }
        },
        onError: (error: Error) => {
          console.error('Payment error:', error);
          setPaymentError(error.message);
          onError(error.message);
          onProcessingChange(false);
        },
        onDismiss: () => {
          console.log('Payment dismissed by user');
          onProcessingChange(false);
        },
      });

    } catch (error) {
      console.error('Error initiating payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
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
        className="w-full bg-green-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pay Securely with Razorpay
          </div>
        )}
      </button>

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
    </div>
  );
}