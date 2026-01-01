'use client';

import React, { useState } from 'react';
import type { OrderStatus } from '@/lib/services/order-status';

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: OrderStatus;
  trackingNumber?: string;
  estimatedDelivery?: string;
  onStatusUpdated?: (newStatus: OrderStatus) => void;
}

export default function OrderStatusManager({
  orderId,
  currentStatus,
  trackingNumber,
  estimatedDelivery,
  onStatusUpdated
}: OrderStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
  const [newTrackingNumber, setNewTrackingNumber] = useState(trackingNumber || '');
  const [newEstimatedDelivery, setNewEstimatedDelivery] = useState(
    estimatedDelivery ? estimatedDelivery.split('T')[0] : ''
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const statusOptions: { value: OrderStatus; label: string; description: string }[] = [
    { value: 'pending', label: 'Pending', description: 'Order placed, awaiting payment confirmation' },
    { value: 'processing', label: 'Processing', description: 'Payment confirmed, preparing for shipment' },
    { value: 'shipped', label: 'Shipped', description: 'Order shipped and on the way' },
    { value: 'delivered', label: 'Delivered', description: 'Order delivered to customer' },
    { value: 'cancelled', label: 'Cancelled', description: 'Order cancelled' }
  ];

  const getValidNextStatuses = (current: OrderStatus): OrderStatus[] => {
    switch (current) {
      case 'pending':
        return ['processing', 'cancelled'];
      case 'processing':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['delivered'];
      case 'delivered':
        return []; // No transitions from delivered
      case 'cancelled':
        return []; // No transitions from cancelled
      default:
        return [];
    }
  };

  const validNextStatuses = getValidNextStatuses(currentStatus);
  const availableStatuses = statusOptions.filter(
    option => option.value === currentStatus || validNextStatuses.includes(option.value)
  );

  const requiresTracking = selectedStatus === 'shipped' && currentStatus !== 'shipped';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStatus === currentStatus && !notes) {
      setError('No changes to update');
      return;
    }

    if (requiresTracking && !newTrackingNumber.trim()) {
      setError('Tracking number is required when marking order as shipped');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        status: selectedStatus,
        notes: notes.trim() || undefined
      };

      if (newTrackingNumber.trim()) {
        updateData.trackingNumber = newTrackingNumber.trim();
      }

      if (newEstimatedDelivery) {
        updateData.estimatedDelivery = newEstimatedDelivery;
      }

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      setSuccess('Order status updated successfully');
      
      // Reset form
      setNotes('');
      
      // Notify parent component
      if (onStatusUpdated) {
        onStatusUpdated(selectedStatus);
      }

    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Update Order Status</h2>
      
      {/* Current Status */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Status
        </label>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)}`}>
          {statusOptions.find(s => s.value === currentStatus)?.label || currentStatus}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isUpdating}
          >
            {availableStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label} - {status.description}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tracking Number
            {requiresTracking && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={newTrackingNumber}
            onChange={(e) => setNewTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isUpdating}
            required={requiresTracking}
          />
          {requiresTracking && (
            <p className="mt-1 text-sm text-gray-600">
              Tracking number is required when marking order as shipped
            </p>
          )}
        </div>

        {/* Estimated Delivery */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Delivery Date
          </label>
          <input
            type="date"
            value={newEstimatedDelivery}
            onChange={(e) => setNewEstimatedDelivery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isUpdating}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this status update..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isUpdating}
          />
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

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setSelectedStatus(currentStatus);
              setNewTrackingNumber(trackingNumber || '');
              setNewEstimatedDelivery(estimatedDelivery ? estimatedDelivery.split('T')[0] : '');
              setNotes('');
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={isUpdating}
          >
            Reset
          </button>
          
          <button
            type="submit"
            disabled={isUpdating || (selectedStatus === currentStatus && !notes.trim())}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </div>
            ) : (
              'Update Status'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}