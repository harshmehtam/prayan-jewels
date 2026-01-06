'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LoginButton } from '@/components/auth';
import { useAuth } from '@/components/providers/auth-provider';
import { OrderService } from '@/lib/data/orders';
import PageLoading from '@/components/ui/PageLoading';
import OrderTracking from '@/components/order/OrderTracking';
import OrderCancellation from '@/components/order/OrderCancellation';
import CustomerSupport from '@/components/order/CustomerSupport';
import OrderModification from '@/components/order/OrderModification';
import type { Order, OrderItem } from '@/types';
import type { OrderStatus } from '@/lib/services/order-status';

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const orderId = params.orderId as string;
  const paymentSuccess = searchParams.get('payment') === 'success';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && orderId) {
      fetchOrderDetails();
    }
  }, [authLoading, isAuthenticated, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch order details
      const orderResult = await OrderService.getOrder(orderId);
      if (orderResult.order) {
        // Convert Amplify order to our Order type, handling nullable fields and relationships
        const amplifyOrder = orderResult.order;
        const order: Order = {
          id: amplifyOrder.id,
          customerId: amplifyOrder.customerId,
          subtotal: amplifyOrder.subtotal,
          tax: amplifyOrder.tax || 0,
          shipping: amplifyOrder.shipping || 0,
          totalAmount: amplifyOrder.totalAmount,
          status: amplifyOrder.status || 'pending',
          paymentOrderId: amplifyOrder.paymentOrderId || undefined,
          trackingNumber: amplifyOrder.trackingNumber || undefined,
          estimatedDelivery: amplifyOrder.estimatedDelivery || undefined,
          shippingFirstName: amplifyOrder.shippingFirstName,
          shippingLastName: amplifyOrder.shippingLastName,
          shippingAddressLine1: amplifyOrder.shippingAddressLine1,
          shippingAddressLine2: amplifyOrder.shippingAddressLine2 || undefined,
          shippingCity: amplifyOrder.shippingCity,
          shippingState: amplifyOrder.shippingState,
          shippingPostalCode: amplifyOrder.shippingPostalCode,
          shippingCountry: amplifyOrder.shippingCountry,
          billingFirstName: amplifyOrder.billingFirstName,
          billingLastName: amplifyOrder.billingLastName,
          billingAddressLine1: amplifyOrder.billingAddressLine1,
          billingAddressLine2: amplifyOrder.billingAddressLine2 || undefined,
          billingCity: amplifyOrder.billingCity,
          billingState: amplifyOrder.billingState,
          billingPostalCode: amplifyOrder.billingPostalCode,
          billingCountry: amplifyOrder.billingCountry,
          createdAt: amplifyOrder.createdAt,
          updatedAt: amplifyOrder.updatedAt,
        };
        setOrder(order);
      } else {
        setError('Order not found');
        return;
      }

      // Fetch order items
      const itemsResult = await OrderService.getOrderItems(orderId);
      const convertedItems: OrderItem[] = itemsResult.items.map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      setOrderItems(convertedItems);

    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return <PageLoading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to view your order details.</p>
          <LoginButton
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            redirectTo={`/account/orders/${orderId}`}
          >
            Log In
          </LoginButton>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/account/orders"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The requested order could not be found.</p>
          <Link
            href="/account/orders"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const formatAddress = (order: Order, type: 'shipping' | 'billing') => {
    const prefix = type === 'shipping' ? 'shipping' : 'billing';
    return [
      `${order[`${prefix}FirstName` as keyof Order]} ${order[`${prefix}LastName` as keyof Order]}`,
      order[`${prefix}AddressLine1` as keyof Order],
      order[`${prefix}AddressLine2` as keyof Order],
      `${order[`${prefix}City` as keyof Order]}, ${order[`${prefix}State` as keyof Order]} ${order[`${prefix}PostalCode` as keyof Order]}`,
      order[`${prefix}Country` as keyof Order]
    ].filter(Boolean).join('\n');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success message for new orders */}
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800">
                  Order Placed Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Thank you for your purchase. Your order has been confirmed and will be processed shortly.</p>
                  <p className="mt-1">You will receive an email confirmation with tracking details once your order ships.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-gray-600 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status || 'pending')}`}>
                {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
              </span>
              {order.trackingNumber && (
                <p className="text-sm text-gray-600 mt-2">
                  Tracking: <span className="font-mono">{order.trackingNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
          
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md"></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.productName}
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
              <span className="text-gray-900">₹{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (GST 18%)</span>
              <span className="text-gray-900">₹{order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">
                {order.shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  `₹${order.shipping.toLocaleString()}`
                )}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order tracking */}
        <OrderTracking
          orderId={order.id}
          currentStatus={(order.status as OrderStatus) || 'pending'}
          trackingNumber={order.trackingNumber}
          estimatedDelivery={order.estimatedDelivery}
        />

        {/* Order cancellation */}
        <OrderCancellation
          order={order}
          onCancellationSuccess={() => {
            // Refresh the page to show updated order status
            window.location.reload();
          }}
        />

        {/* Order modification */}
        <OrderModification
          order={order}
          orderItems={orderItems}
          onModificationSuccess={() => {
            // Show success message or refresh data
            alert('Modification request submitted successfully! Our team will contact you within 2 hours.');
          }}
        />

        {/* Customer support */}
        <CustomerSupport orderId={order.id} className="mb-6" />

        {/* Shipping and billing addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {formatAddress(order, 'shipping')}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {formatAddress(order, 'billing')}
            </div>
          </div>
        </div>

        {/* Payment information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="text-gray-900">Razorpay</span>
            </div>
            {order.paymentOrderId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment ID</span>
                <span className="text-gray-900 font-mono">{order.paymentOrderId}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Status</span>
              <span className="text-green-600 font-medium">
                {order.status === 'pending' ? 'Pending' : 'Completed'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <Link
            href="/account/orders"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Back to Orders
          </Link>
          
          <div className="space-x-4">
            <Link
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}