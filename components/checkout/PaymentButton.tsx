'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { clearCartAction } from '@/app/actions/cart-actions';
import { createOrder } from '@/app/actions/order-actions';
import { createRazorpayOrderAction, verifyRazorpayPaymentAction } from '@/app/actions/razorpay-actions';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/services/razorpay';
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
      
      const customerEmail = (shippingAddress as Record<string, unknown>).email as string;
      
      if (!customerEmail) {
        throw new Error('Email address is required for order placement');
      }
      
      const customerPhone = (shippingAddress as Record<string, unknown>).phone as string || '';
      const guestCustomerId = user?.userId || `guest_${btoa(customerEmail + '_' + customerPhone).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
      
      // Prepare order data for server action
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
        // Use Server Action to create COD order
        try {
          const orderResult = await createOrder(orderData);
          
          if (!orderResult.success) {
            throw new Error(orderResult.error || 'Failed to create order');
          }
          
          await clearCartAction();
          onSuccess(orderResult.orderId!, 'COD_' + Date.now(), orderResult.confirmationNumber, 'cash_on_delivery');
        } catch (codError) {
          const errorMessage = codError instanceof Error ? codError.message : 'Failed to create order';
          setPaymentError(errorMessage);
          onError(errorMessage);
        } finally {
          onProcessingChange(false);
        }
      } else {
        // Handle Razorpay payment using server actions
        try {
          // Load Razorpay script
          await loadRazorpayScript();
          // Prepare order data for Razorpay action
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
              addressLine2: shippingAddress.addressLine2 || undefined,
              city: shippingAddress.city!,
              state: shippingAddress.state!,
              postalCode: shippingAddress.postalCode!,
              country: shippingAddress.country!,
            },
            billingAddress: {
              firstName: billingAddress.firstName!,
              lastName: billingAddress.lastName!,
              addressLine1: billingAddress.addressLine1!,
              addressLine2: billingAddress.addressLine2 || undefined,
              city: billingAddress.city!,
              state: billingAddress.state!,
              postalCode: billingAddress.postalCode!,
              country: billingAddress.country!,
            },
            couponId: appliedCoupon?.id,
            couponCode: appliedCoupon?.code,
            couponDiscount: appliedCoupon?.discountAmount || 0,
          };

          // Create Razorpay order using server action
          const orderResult = await createRazorpayOrderAction(razorpayOrderData);

          if (!orderResult.success || !orderResult.razorpayOrder || !orderResult.orderId) {
            throw new Error(orderResult.error || 'Failed to create Razorpay order');
          }

          // Open Razorpay checkout modal
          openRazorpayCheckout({
            orderId: orderResult.razorpayOrder.id as string,
            amount: orderResult.razorpayOrder.amount as number,
            currency: orderResult.razorpayOrder.currency as string,
            customerName,
            customerEmail,
            customerPhone,
            customerId: guestCustomerId,
            onSuccess: async (response) => {
              try {
                // Verify payment using server action
                const verificationResult = await verifyRazorpayPaymentAction(
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  orderResult.orderId!
                );

                if (!verificationResult.success) {
                  throw new Error(verificationResult.error || 'Payment verification failed');
                }
                // Clear cart
                await clearCartAction();

                // Call success callback
                onSuccess(
                  orderResult.orderId!,
                  response.razorpay_payment_id,
                  verificationResult.confirmationNumber,
                  'razorpay'
                );
              } catch (verificationError) {
                const errorMessage = verificationError instanceof Error 
                  ? verificationError.message 
                  : 'Payment verification failed';
                setPaymentError(errorMessage);
                onError('Payment successful but verification failed. Please contact support.');
              } finally {
                onProcessingChange(false);
              }
            },
            onError: (error) => {
              setPaymentError(error.message);
              onError(error.message);
              onProcessingChange(false);
            },
            onDismiss: () => {
              setPaymentError(null);
              onProcessingChange(false);
            },
          });
        } catch (razorpayError) {
          const errorMessage = razorpayError instanceof Error 
            ? razorpayError.message 
            : 'Failed to process payment';
          setPaymentError(errorMessage);
          onError(errorMessage);
          onProcessingChange(false);
        }
      }
    } catch (error) {
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