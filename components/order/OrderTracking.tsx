'use client';

import React, { useState, useEffect } from 'react';
import type { OrderStatus } from '@/lib/services/order-status';

interface OrderTrackingProps {
  orderId: string;
  currentStatus: OrderStatus;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface TrackingInfo {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: Date;
    notes?: string;
  }>;
}

export default function OrderTracking({ 
  orderId, 
  currentStatus, 
  trackingNumber, 
  estimatedDelivery 
}: OrderTrackingProps) {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackingInfo();
  }, [orderId]);

  const fetchTrackingInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tracking info');
      }

      if (data.success && data.tracking) {
        setTrackingInfo(data.tracking);
      }

    } catch (err) {
      console.error('Error fetching tracking info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case 'shipped':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'delivered':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'cancelled':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-800';
      case 'processing':
        return 'text-blue-800';
      case 'shipped':
        return 'text-purple-800';
      case 'delivered':
        return 'text-green-800';
      case 'cancelled':
        return 'text-red-800';
      default:
        return 'text-gray-800';
    }
  };

  const formatStatusName = (status: OrderStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Tracking</h2>
        <div className="animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Tracking</h2>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load tracking</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchTrackingInfo}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tracking = trackingInfo || {
    orderId,
    status: currentStatus,
    trackingNumber,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
    statusHistory: [
      {
        status: currentStatus,
        timestamp: new Date(),
        notes: 'Current status'
      }
    ]
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Tracking</h2>
      
      {/* Current Status Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(tracking.status)}
            <div>
              <h3 className={`font-medium ${getStatusColor(tracking.status)}`}>
                {formatStatusName(tracking.status)}
              </h3>
              <p className="text-sm text-gray-600">
                Current status of your order
              </p>
            </div>
          </div>
          
          {tracking.trackingNumber && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Tracking Number</p>
              <p className="font-mono text-sm font-medium text-gray-900">
                {tracking.trackingNumber}
              </p>
            </div>
          )}
        </div>
        
        {tracking.estimatedDelivery && tracking.status !== 'delivered' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Estimated Delivery: {' '}
              <span className="font-medium text-gray-900">
                {tracking.estimatedDelivery.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Status History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status History</h3>
        <div className="space-y-4">
          {tracking.statusHistory.map((historyItem, index) => (
            <div key={index} className="flex items-start space-x-4">
              {getStatusIcon(historyItem.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${getStatusColor(historyItem.status)}`}>
                    {formatStatusName(historyItem.status)}
                  </h4>
                  <time className="text-sm text-gray-500">
                    {historyItem.timestamp.toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                </div>
                {historyItem.notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    {historyItem.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}