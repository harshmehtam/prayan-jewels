'use client';

import { useState } from 'react';
import { GuestOrderLookup } from '@/lib/utils/guest-order-lookup';
import { OrderCancellationService } from '@/lib/services/order-cancellation';
import { CancelOrderDialog } from '@/components/order/CancelOrderDialog';
import { Toast } from '@/components/ui/Toast';

export default function TrackOrderPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !phone || !confirmationNumber) {
      setError('Email, phone number, and order number are required');
      return;
    }

    setLoading(true);
    setError('');
    setOrders([]);

    try {
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
    } catch (err) {
      setError('An error occurred while searching for orders');
      console.error('Order search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const canCancelOrder = (order: any) => {
    // Check if order can be cancelled based on status
    if (!OrderCancellationService.canCancelOrder(order)) {
      return false;
    }

    // Additional check: Ensure this is a guest order
    if (!OrderCancellationService.isGuestOrder(order)) {
      return false;
    }

    return true;
  };

  const handleCancelOrderClick = (order: any) => {
    setOrderToCancel(order);
    setShowCancelDialog(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) {
      return;
    }

    setCancellingOrderId(orderToCancel.id);
    try {
      const result = await OrderCancellationService.cancelOrderForGuest(orderToCancel.id, email, phone);

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderToCancel.id 
            ? { ...order, status: 'cancelled' }
            : order
        )
      );
      
      showToast(result.message || 'Order cancelled successfully.', 'success');
      setShowCancelDialog(false);
      setOrderToCancel(null);

    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast(error instanceof Error ? error.message : 'Failed to cancel order. Please try again.', 'error');
    } finally {
      setCancellingOrderId(null);
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
    <div className="min-h-screen bg-gray-50 pt-32 sm:pt-36 md:pt-52 lg:pt-36 pb-12 sm:pb-16 lg:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-600">
            Enter your order number, email and phone number to track your order
          </p>
        </div>

        {/* Cancellation Policy Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Order Cancellation</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>You can cancel guest orders that are still "Pending" or "Processing"</li>
                  <li>Orders placed while signed in must be cancelled from your account page</li>
                  <li>Once shipped, please contact customer support for returns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label htmlFor="confirmationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Order Number (Confirmation Number) *
              </label>
              <input
                type="text"
                id="confirmationNumber"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter your order number"
              />
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
                'Track Order'
              )}
            </button>
          </form>
        </div>

        {/* Orders Results */}
        {orders.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            
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

                {order.items && Array.isArray(order.items) && order.items.length > 0 && (
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

                {/* Order Actions */}
                {canCancelOrder(order) ? (
                  <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                    <button
                      onClick={() => handleCancelOrderClick(order)}
                      disabled={cancellingOrderId === order.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                    <div className="text-right">
                      {OrderCancellationService.canCancelOrder(order) ? (
                        // Order status allows cancellation but other conditions don't
                        !OrderCancellationService.isGuestOrder(order) ? (
                          <div className="text-xs text-gray-500">
                            <p>This order was placed with an account.</p>
                            <p>Please sign in to cancel it.</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Cannot cancel</span>
                        )
                      ) : (
                        // Order status doesn't allow cancellation
                        <span className="text-xs text-gray-500">
                          {order.status === 'shipped' ? 'Already shipped - contact support for returns' :
                           order.status === 'delivered' ? 'Already delivered - contact support for returns' :
                           order.status === 'cancelled' ? 'Already cancelled' :
                           'Cannot cancel at this stage'}
                        </span>
                      )}
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

        {/* Cancel Order Dialog */}
        <CancelOrderDialog
          isOpen={showCancelDialog}
          onClose={() => {
            setShowCancelDialog(false);
            setOrderToCancel(null);
          }}
          onConfirm={handleCancelOrder}
          orderNumber={orderToCancel?.confirmationNumber || orderToCancel?.id || ''}
          paymentMethod={orderToCancel?.paymentMethod || 'cash_on_delivery'}
          isLoading={cancellingOrderId === orderToCancel?.id}
        />

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />
      </div>
    </div>
  );
}