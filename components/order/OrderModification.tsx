'use client';

import { useState } from 'react';
import type { Order, OrderItem } from '@/types';
import type { OrderStatus } from '@/lib/services/order-status';

interface OrderModificationProps {
  order: Order;
  orderItems: OrderItem[];
  onModificationSuccess: () => void;
}

interface ModificationRequest {
  type: 'address_change' | 'item_quantity' | 'add_item';
  details: string;
  newShippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export default function OrderModification({ order, orderItems, onModificationSuccess }: OrderModificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModificationForm, setShowModificationForm] = useState(false);
  const [modificationType, setModificationType] = useState<ModificationRequest['type']>('address_change');
  const [modificationDetails, setModificationDetails] = useState('');
  const [newAddress, setNewAddress] = useState({
    firstName: order.shippingFirstName,
    lastName: order.shippingLastName,
    addressLine1: order.shippingAddressLine1,
    addressLine2: order.shippingAddressLine2 || '',
    city: order.shippingCity,
    state: order.shippingState,
    postalCode: order.shippingPostalCode,
    country: order.shippingCountry,
  });

  // Check if order is eligible for modification
  const isEligibleForModification = () => {
    const eligibleStatuses: OrderStatus[] = ['pending', 'processing'];
    return eligibleStatuses.includes(order.status as OrderStatus);
  };

  // Calculate time remaining for modification (12 hours from order creation)
  const getModificationTimeRemaining = () => {
    const orderDate = new Date(order.createdAt);
    const modificationDeadline = new Date(orderDate.getTime() + (12 * 60 * 60 * 1000)); // 12 hours
    const now = new Date();
    
    if (now > modificationDeadline) {
      return null; // Past deadline
    }
    
    const timeRemaining = modificationDeadline.getTime() - now.getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: hoursRemaining, minutes: minutesRemaining };
  };

  const handleSubmitModification = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const modificationRequest: ModificationRequest = {
        type: modificationType,
        details: modificationDetails,
        ...(modificationType === 'address_change' && { newShippingAddress: newAddress })
      };

      const response = await fetch(`/api/orders/${order.id}/modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modificationRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit modification request');
      }

      if (data.success) {
        onModificationSuccess();
        setShowModificationForm(false);
        setModificationDetails('');
      } else {
        throw new Error(data.error || 'Failed to submit modification request');
      }

    } catch (err) {
      console.error('Error submitting modification:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit modification request');
    } finally {
      setIsLoading(false);
    }
  };

  const timeRemaining = getModificationTimeRemaining();
  const isEligible = isEligibleForModification();

  if (!isEligible || !timeRemaining) {
    return null; // Don't show modification option if not eligible
  }

  return (
    <>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              Order Modification Available
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                You can request modifications to this order within 12 hours of placing it.
              </p>
              <p className="mt-1">
                Time remaining: <span className="font-medium">
                  {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
              </p>
              <p className="mt-1 text-xs">
                Available modifications: Address change, quantity adjustments (subject to availability)
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowModificationForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Request Modification
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modification Form Modal */}
      {showModificationForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Request Order Modification
                </h3>
                <button
                  onClick={() => {
                    setShowModificationForm(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modification Type
                  </label>
                  <select
                    value={modificationType}
                    onChange={(e) => setModificationType(e.target.value as ModificationRequest['type'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="address_change">Change Shipping Address</option>
                    <option value="item_quantity">Modify Item Quantities</option>
                    <option value="add_item">Add Items to Order</option>
                  </select>
                </div>

                {modificationType === 'address_change' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">New Shipping Address</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={newAddress.firstName}
                        onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={newAddress.lastName}
                        onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={newAddress.addressLine2}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={modificationDetails}
                    onChange={(e) => setModificationDetails(e.target.value)}
                    placeholder="Please provide specific details about your modification request..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Modification requests are subject to approval and availability. 
                        We'll contact you within 2 hours to confirm if your request can be processed.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSubmitModification}
                    disabled={isLoading || !modificationDetails.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModificationForm(false);
                      setError(null);
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}