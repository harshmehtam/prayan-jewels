// Admin order management interface with filtering, search, and analytics
'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '@/types';
import { AdminOrderService, OrderFilters, OrderAnalytics, OrderUpdateData } from '@/lib/services/admin-orders';
import { PermissionGate } from '@/components/auth/AdminRoute';
import { LoadingSpinner } from '@/components/ui';

interface AdminOrderManagerProps {
  className?: string;
}

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: (orderId: string, updateData: OrderUpdateData) => Promise<void>;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.estimatedDelivery ? order.estimatedDelivery.split('T')[0] : ''
  );
  const [notes, setNotes] = useState('');

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await onUpdate(order.id, {
        status,
        trackingNumber: trackingNumber || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
        notes: notes || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Information */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Order Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Order ID:</span>
                  <span className="text-sm text-gray-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Confirmation:</span>
                  <span className="text-sm text-gray-900">{order.confirmationNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Payment ID:</span>
                  <span className="text-sm text-gray-900">{order.paymentOrderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Order Date:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <span className="text-sm font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Customer ID:</span>
                  <span className="text-sm text-gray-900">{order.customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <span className="text-sm text-gray-900">
                    {order.shippingFirstName} {order.shippingLastName}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Order Items</h4>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">{item.productName}</h5>
                        <p className="text-sm text-gray-600">Product ID: {item.productId}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">₹{item.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">₹{item.unitPrice.toLocaleString()} each</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shipping & Update Form */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">
                  {order.shippingFirstName} {order.shippingLastName}
                </p>
                <p className="text-sm text-gray-600">{order.shippingAddressLine1}</p>
                {order.shippingAddressLine2 && (
                  <p className="text-sm text-gray-600">{order.shippingAddressLine2}</p>
                )}
                <p className="text-sm text-gray-600">
                  {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                </p>
                <p className="text-sm text-gray-600">{order.shippingCountry}</p>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">
                  {order.billingFirstName} {order.billingLastName}
                </p>
                <p className="text-sm text-gray-600">{order.billingAddressLine1}</p>
                {order.billingAddressLine2 && (
                  <p className="text-sm text-gray-600">{order.billingAddressLine2}</p>
                )}
                <p className="text-sm text-gray-600">
                  {order.billingCity}, {order.billingState} {order.billingPostalCode}
                </p>
                <p className="text-sm text-gray-600">{order.billingCountry}</p>
              </div>
            </div>

            {/* Order Update Form */}
            <PermissionGate resource="admin/orders" action="update">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Update Order</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Order['status'])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                    <input
                      type="date"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this update"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {updating && <LoadingSpinner size="sm" />}
                    <span>Update Order</span>
                  </button>
                </div>
              </div>
            </PermissionGate>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm text-gray-900">₹{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Tax:</span>
              <span className="text-sm text-gray-900">₹{order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Shipping:</span>
              <span className="text-sm text-gray-900">₹{order.shipping.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
              <span className="text-sm text-gray-900">Total:</span>
              <span className="text-sm text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminOrderManager({ className = '' }: AdminOrderManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'processing' | 'shipped' | 'delivered' | 'cancelled' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<OrderFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilters['status']>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const ordersPerPage = 20;

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters: OrderFilters = {
        searchQuery: searchQuery || undefined,
        status: statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      };
      
      const offset = (currentPage - 1) * ordersPerPage;
      const result = await AdminOrderService.getOrders(currentFilters, ordersPerPage, offset);
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      setOrders(result.orders);
      setTotalCount(result.totalCount);
      setFilters(currentFilters);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const result = await AdminOrderService.getOrderAnalytics(
        dateFrom || undefined,
        dateTo || undefined
      );
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      setAnalytics(result.analytics);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage]);

  useEffect(() => {
    loadAnalytics();
  }, [dateFrom, dateTo]);

  // Handle order update
  const handleOrderUpdate = async (orderId: string, updateData: OrderUpdateData) => {
    try {
      setError(null);
      const result = await AdminOrderService.updateOrder(orderId, updateData);
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      // Refresh orders list
      await loadOrders();
      await loadAnalytics();
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.size === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to update ${selectedOrders.size} orders to ${bulkAction} status?`)) {
      return;
    }

    try {
      setError(null);
      const orderIds = Array.from(selectedOrders);
      await AdminOrderService.bulkUpdateOrders(orderIds, { status: bulkAction });
      
      setSelectedOrders(new Set());
      setBulkAction('');
      await loadOrders();
      await loadAnalytics();
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  };

  // Handle order selection
  const handleOrderSelect = (orderId: string, selected: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (selected) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadOrders();
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(undefined);
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
    setTimeout(loadOrders, 100);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalCount / ordersPerPage);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage customer orders and track fulfillment</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
          </button>
          <button
            onClick={loadOrders}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <PermissionGate resource="admin/orders" action="read">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Analytics</h2>
            
            {analyticsLoading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner />
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Total Orders</p>
                        <p className="text-2xl font-semibold text-blue-900">{analytics.totalOrders}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Total Revenue</p>
                        <p className="text-2xl font-semibold text-green-900">₹{analytics.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Avg Order Value</p>
                        <p className="text-2xl font-semibold text-purple-900">₹{Math.round(analytics.averageOrderValue).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-600">Pending Orders</p>
                        <p className="text-2xl font-semibold text-yellow-900">{analytics.ordersByStatus.pending}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders by Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-3">Orders by Status</h3>
                    <div className="space-y-2">
                      {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-3">Top Products</h3>
                    <div className="space-y-2">
                      {analytics.topProducts.slice(0, 5).map((product) => (
                        <div key={product.productId} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                            <p className="text-xs text-gray-600">{product.totalQuantity} sold</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">₹{product.totalRevenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </PermissionGate>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order ID, customer name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value as OrderFilters['status'] || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="₹0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="₹10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={applyFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedOrders.size} orders selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="px-3 py-1 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Action</option>
                <option value="processing">Mark as Processing</option>
                <option value="shipped">Mark as Shipped</option>
                <option value="delivered">Mark as Delivered</option>
                <option value="cancelled">Mark as Cancelled</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <PermissionGate resource="admin/orders" action="update">
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Apply Action
                </button>
              </PermissionGate>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={(e) => handleOrderSelect(order.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.id}</div>
                          <div className="text-sm text-gray-500">
                            {order.confirmationNumber && `Conf: ${order.confirmationNumber}`}
                          </div>
                          {order.trackingNumber && (
                            <div className="text-sm text-gray-500">Track: {order.trackingNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.shippingFirstName} {order.shippingLastName}
                        </div>
                        <div className="text-sm text-gray-500">{order.customerId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * ordersPerPage + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * ordersPerPage, totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
}