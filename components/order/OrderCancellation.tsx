'use client';

import { useState } from 'react';
import { updateOrderStatus } from '@/lib/services/order-service';
import type { Order } from '@/types';
import type { OrderStatus } from '@/lib/services/order-status';

interface OrderCancellationProps {
  order: Order;
  onCancellationSuccess: () => void;
}

export default function OrderCancellation({ order, onCancellationSuccess }: OrderCancellationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check if order is eligible for cancellation
  const isEligibleForCancellation = () => {
    const eligibleStatuses: OrderStatus[] = ['pending', 'processing'];
    return eligibleStatuses.includes(order.status as OrderStatus);
  };

  const handleCancelOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if order is eligible for cancellation
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

      // Use updateOrderStatus function to update order status to cancelled
      const updateResult = await updateOrderStatus(order.id, 'cancelled');

      if (updateResult.errors && updateResult.errors.length > 0) {
        throw new Error(`Failed to cancel order: ${updateResult.errors.map(e => e.message).join(', ')}`);
      }

      if (updateResult.order) {
        onCancellationSuccess();
        setShowConfirmation(false);
      } else {
        throw new Error('Failed to cancel order');
      }

    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  };

  const isEligible = isEligibleForCancellation();

  if (!isEligible) {
    return null; // Don't show cancellation option if not eligible
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Order Cancellation Available
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              You can cancel this order since it hasn't been shipped yet.
            </p>
            <p className="mt-1">
              Status: <span className="font-medium capitalize">{order.status}</span>
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Cancel Order
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to cancel this order? This action cannot be undone.
                  If you paid online, your refund will be processed within 5-7 business days.
                </p>
              </div>
              {error && (
                <div className="mt-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="items-center px-4 py-3">
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmation(false);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  No, Keep Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}