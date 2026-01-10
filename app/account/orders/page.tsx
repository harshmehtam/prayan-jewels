'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderService } from '@/lib/services/order-service';
import type { Schema } from '@/amplify/data/resource';

// Define order type with items as a simple array
type OrderWithItems = Schema['Order']['type'] & {
  items?: any[];
};

// Prevent SSR for this page
export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Simple useEffect - load orders when user is available
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    
    if (!isAuthenticated || !user?.userId) {
      setIsLoadingOrders(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const customerOrders = await OrderService.getCustomerOrders(user.userId);
        const sortedOrders = customerOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders as OrderWithItems[]);
      } catch (error) {
        console.error('Error loading orders:', error);
        setError('Failed to load orders. Please try again.');
      } finally {
        setIsLoadingOrders(false);
      }
    };

    loadOrders();
  }, [user?.userId, isAuthenticated, authLoading]);

  const canCancelOrder = (order: OrderWithItems) => {
    const eligibleStatuses = ['pending', 'processing'];
    return order.status && eligibleStatuses.includes(order.status);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const eligibleStatuses = ['pending', 'processing'];
      if (!order.status || !eligibleStatuses.includes(order.status)) {
        let errorMessage = 'Order cannot be cancelled at this stage';
        
        if (order.status === 'shipped') {
          errorMessage = 'Order has already been shipped and cannot be cancelled. Please contact customer support for returns.';
        } else if (order.status === 'delivered') {
          errorMessage = 'Order has been delivered and cannot be cancelled. Please contact customer support for returns.';
        } else if (order.status === 'cancelled') {
          errorMessage = 'Order has already been cancelled.';
        }
        
        throw new Error(errorMessage);
      }

      const updateResult = await OrderService.updateOrderStatus(orderId, 'cancelled');

      if (updateResult.errors && updateResult.errors.length > 0) {
        throw new Error(`Failed to cancel order: ${updateResult.errors.map(e => e.message).join(', ')}`);
      }

      // Simple local state update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' }
            : order
        )
      );
      
      alert('Order cancelled successfully. If you paid online, refund will be processed within 5-7 business days.');

    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrderId(null);
    }
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

  const getOrderStatusMessage = (order: OrderWithItems) => {
    switch (order.status) {
      case 'pending':
        return 'Your order is being processed';
      case 'processing':
        return 'Order confirmed and being prepared';
      case 'shipped':
        return order.trackingNumber ? `Shipped - Tracking: ${order.trackingNumber}` : 'Your order has been shipped';
      case 'delivered':
        return 'Order delivered successfully';
      case 'cancelled':
        return 'Order was cancelled';
      default:
        return 'Order status unknown';
    }
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in</h3>
            <p className="text-gray-600 mb-6">You need to be signed in to view your order history</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Go to Home & Sign In
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/account"
              className="text-blue-600 hover:text-blue-700 mr-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          </div>
          <p className="text-gray-600">View and manage your orders. You can cancel confirmed orders that haven't shipped yet.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {isLoadingOrders ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.confirmationNumber || order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {getOrderStatusMessage(order)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status || 'pending')}`}>
                        {order.status || 'pending'}
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </p>
                      {order.paymentMethod && (
                        <p className="text-xs text-gray-500 mt-1">
                          {order.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Online Payment'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Items ({order.items.length})</h4>
                      <div className="space-y-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {item.productName} × {item.quantity}
                            </span>
                            <span className="text-gray-900">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping Information */}
                  {order.shippingFirstName && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                      <p className="text-sm text-gray-600">
                        {order.shippingFirstName} {order.shippingLastName}<br />
                        {order.shippingAddressLine1}<br />
                        {order.shippingAddressLine2 && <>{order.shippingAddressLine2}<br /></>}
                        {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                      </p>
                    </div>
                  )}

                  {/* Tracking Information */}
                  {order.trackingNumber && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-gray-600">
                        Tracking Number: <span className="font-medium text-gray-900 font-mono">{order.trackingNumber}</span>
                      </p>
                      {order.estimatedDelivery && (
                        <p className="text-sm text-gray-600 mt-1">
                          Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-4 mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      {(order.status === 'shipped' || order.status === 'delivered') && order.trackingNumber && (
                        <a
                          href={`https://www.google.com/search?q=track+package+${order.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Track Package
                        </a>
                      )}
                    </div>
                    
                    {/* Cancel Order Button */}
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingOrderId === order.id}
                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">When you place your first order, it will appear here</p>
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Start Shopping
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}