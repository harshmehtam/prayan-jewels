'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CheckoutHeader from '@/components/layout/CheckoutHeader';
import { OrderService } from '@/lib/services/order-service';

interface OrderDetails {
  id: string;
  confirmationNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  customerEmail: string;
  estimatedDelivery?: string;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const paymentParam = searchParams.get('payment');
    
    setOrderId(orderIdParam);
    setPaymentStatus(paymentParam);

    // Load order details
    if (orderIdParam) {
      loadOrderDetails(orderIdParam);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const loadOrderDetails = async (orderIdParam: string) => {
    try {
      const order = await OrderService.getOrderById(orderIdParam);
      if (order) {
        setOrderDetails({
          id: order.id,
          confirmationNumber: order.confirmationNumber || order.id,
          totalAmount: order.totalAmount,
          status: order.status || 'pending',
          paymentMethod: order.paymentMethod || 'unknown',
          paymentStatus: order.paymentStatus || 'pending',
          customerEmail: order.customerEmail || '',
          estimatedDelivery: order.estimatedDelivery || '',
        });
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CheckoutHeader />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-pulse">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === 'success' || paymentStatus === 'cod';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Checkout Header */}
      <CheckoutHeader />
      
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {isSuccess ? (
            <>
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Order Confirmed!
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Thank you for your purchase. Your order has been successfully placed.
              </p>

              {/* Order Details */}
              {orderDetails && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Order Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold text-gray-900">{orderDetails.confirmationNumber}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-gray-900">₹{orderDetails.totalAmount.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold text-gray-900">
                        {orderDetails.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {orderDetails.paymentStatus === 'pending' && orderDetails.paymentMethod === 'cash_on_delivery' 
                          ? 'COD - Pay on Delivery' 
                          : orderDetails.paymentStatus
                        }
                      </p>
                    </div>
                    
                    {orderDetails.estimatedDelivery && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Estimated Delivery</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {orderId && !orderDetails && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Order ID</p>
                  <p className="text-lg font-semibold text-gray-900">{orderId}</p>
                </div>
              )}

              <div className="space-y-4 text-sm text-gray-600 mb-8">
                <p>• You will receive an order confirmation email shortly</p>
                <p>• Your order will be processed within 1-2 business days</p>
                <p>• You'll receive tracking information once your order ships</p>
                {paymentStatus === 'cod' && (
                  <p>• Please keep the exact amount ready for cash on delivery</p>
                )}
              </div>

              <div className="space-y-3">
                <Link
                  href="/products"
                  className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block"
                >
                  Continue Shopping
                </Link>
                
                <Link
                  href="/"
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-block"
                >
                  Back to Homepage
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Order Status Unknown
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                We couldn't verify your order status. Please contact support if you need assistance.
              </p>

              {orderId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Order ID</p>
                  <p className="text-lg font-semibold text-gray-900">{orderId}</p>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  href="/"
                  className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block"
                >
                  Back to Homepage
                </Link>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@prayanjewels.com" className="text-black hover:text-gray-700 underline">
                support@prayanjewels.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}