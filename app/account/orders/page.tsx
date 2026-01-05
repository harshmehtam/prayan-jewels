'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MockOrderService } from '@/lib/data/mock-orders';
import type { Order } from '@/types';

// Prevent SSR for this page
export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      if (user?.userId) {
        try {
          const response = await MockOrderService.getUserOrders(user.userId);
          setOrders(response.orders);
        } catch (error) {
          console.error('Error loading orders:', error);
        } finally {
          setIsLoadingOrders(false);
        }
      }
    };

    if (user) {
      loadOrders();
    }
  }, [user]);

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
          <p className="text-gray-600">View and track your orders</p>
        </div>

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
                        Order #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {item.productName} × {item.quantity}
                            </span>
                            <span className="text-gray-900">₹{item.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracking Information */}
                  {order.trackingNumber && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-gray-600">
                        Tracking Number: <span className="font-medium text-gray-900">{order.trackingNumber}</span>
                      </p>
                      {order.estimatedDelivery && (
                        <p className="text-sm text-gray-600 mt-1">
                          Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-4 mt-4 flex items-center space-x-4">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    {order.status === 'pending' && (
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Cancel Order
                      </button>
                    )}
                    {(order.status === 'shipped' || order.status === 'delivered') && order.trackingNumber && (
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Track Package
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
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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