'use client';

import { useState } from 'react';
import { GuestOrderLookup } from '@/lib/utils/guest-order-lookup';
import type { Order } from '@/types';

export default function TrackOrderPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'specific'>('specific');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !phone) {
      setError('Email and phone number are required');
      return;
    }

    setLoading(true);
    setError('');
    setOrders([]);

    try {
      if (searchType === 'specific' && confirmationNumber) {
        // Search for specific order by confirmation number
        const order = await GuestOrderLookup.findGuestOrderByConfirmation(
          confirmationNumber,
          email,
          phone
        );
        
        if (order) {
          setOrders([order]);
        } else {
          setError('Order not found or credentials do not match');
        }
      } else {
        // Search for all orders by email and phone
        const foundOrders = await GuestOrderLookup.findGuestOrders(email, phone);
        
        if (foundOrders.length > 0) {
          setOrders(foundOrders);
        } else {
          setError('No orders found for the provided email and phone number');
        }
      }
    } catch (err) {
      setError('An error occurred while searching for orders');
      console.error('Order search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-600">
            Enter your email and phone number to track your orders
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Type Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Search Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="specific"
                    checked={searchType === 'specific'}
                    onChange={(e) => setSearchType(e.target.value as 'specific')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Search by Order Number</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={searchType === 'all'}
                    onChange={(e) => setSearchType(e.target.value as 'all')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Show All My Orders</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {searchType === 'specific' && (
              <div>
                <label htmlFor="confirmationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Confirmation Number
                </label>
                <input
                  type="text"
                  id="confirmationNumber"
                  value={confirmationNumber}
                  onChange={(e) => setConfirmationNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter your order confirmation number"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Searching...
                </div>
              ) : (
                'Track Orders'
              )}
            </button>
          </form>
        </div>

        {/* Orders Results */}
        {orders.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {orders.length === 1 ? 'Order Details' : `Found ${orders.length} Orders`}
            </h2>
            
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.confirmationNumber || order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus === 'pending' && order.paymentMethod === 'cash_on_delivery' 
                        ? 'COD - Pay on Delivery' 
                        : order.paymentStatus || 'Pending'
                      }
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium text-gray-900">
                      {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}
                    </p>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}

                {order.estimatedDelivery && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{order.shippingFirstName} {order.shippingLastName}</p>
                    <p>{order.shippingAddressLine1}</p>
                    {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                    <p>{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}</p>
                    <p>{order.shippingCountry}</p>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-gray-600">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString()}</p>
                          </div>
                          <p className="font-medium text-gray-900">₹{item.totalPrice.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Need help with your order?</p>
          <p className="text-sm">
            <strong>Email:</strong>{' '}
            <a href="mailto:support@prayanjewels.com" className="text-black hover:text-gray-700 underline">
              support@prayanjewels.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}