'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import * as addressActions from '@/app/actions/address-actions';
import type { SavedAddress, AddressInput } from '@/lib/services/address-service';
import { useRouter } from 'next/navigation';
import { AddressForm } from '@/components/checkout/AddressForm';
import type { Address } from '@/types';

export default function AddressesPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addingAddressType, setAddingAddressType] = useState<'shipping' | 'billing' | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);

  const loadAddresses = useCallback(async () => {
    if (!user?.userId) return;

    setIsLoading(true);
    try {
      const userAddresses = await addressActions.getUserAddresses(user.userId);
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user?.userId) {
      loadAddresses();
    }
  }, [user, authLoading, router, loadAddresses]);

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const success = await addressActions.deleteAddress(addressId);
      if (success) {
        await loadAddresses();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefault = async (addressId: string, type: 'shipping' | 'billing') => {
    if (!user?.userId) return;

    try {
      const success = await addressActions.setDefaultAddress(user.userId, addressId, type);
      if (success) {
        await loadAddresses();
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
  };

  const handleUpdateAddress = async (addressData: Partial<Address>) => {
    if (!editingAddress) return;

    setIsFormLoading(true);
    try {
      // Convert Address to AddressInput format
      const updateData: Partial<AddressInput> = {
        type: addressData.type as 'shipping' | 'billing',
        firstName: addressData.firstName,
        lastName: addressData.lastName,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2 || undefined,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country,
        isDefault: addressData.isDefault || undefined,
      };

      const success = await addressActions.updateAddress(editingAddress.id, updateData);
      if (success) {
        await loadAddresses();
        setEditingAddress(null);
      }
    } catch (error) {
      console.error('Error updating address:', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    setAddingAddressType(null);
  };

  const handleSaveNewAddress = async (addressData: Partial<Address>) => {
    if (!user?.userId) return;

    setIsFormLoading(true);
    try {
      // Convert Address to AddressInput format
      const addressInput: AddressInput = {
        type: addressData.type as 'shipping' | 'billing',
        firstName: addressData.firstName!,
        lastName: addressData.lastName!,
        addressLine1: addressData.addressLine1!,
        addressLine2: addressData.addressLine2 || undefined,
        city: addressData.city!,
        state: addressData.state!,
        postalCode: addressData.postalCode!,
        country: addressData.country!,
        isDefault: addressData.isDefault || false,
      };

      const success = await addressActions.saveAddress(user.userId, addressInput);
      if (success) {
        await loadAddresses();
        setAddingAddressType(null);
      }
    } catch (error) {
      console.error('Error saving new address:', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const shippingAddresses = addresses.filter(addr => addr.type === 'shipping');
  const billingAddresses = addresses.filter(addr => addr.type === 'billing');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
          <p className="mt-2 text-gray-600">
            Manage your saved shipping and billing addresses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Addresses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Shipping Addresses ({shippingAddresses.length})
              </h2>
              <button
                onClick={() => setAddingAddressType('shipping')}
                className="px-3 py-1.5 bg-black text-white text-sm rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Add New
              </button>
            </div>
            
            <div className="space-y-4">
              {shippingAddresses.length > 0 ? (
                shippingAddresses.map((address) => (
                  <div
                    key={address.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="font-medium text-gray-900">
                            {address.firstName} {address.lastName}
                          </p>
                          {address.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address.id, 'shipping')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">No shipping addresses saved</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add addresses during checkout to save them for future orders
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Billing Addresses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Billing Addresses ({billingAddresses.length})
              </h2>
              <button
                onClick={() => setAddingAddressType('billing')}
                className="px-3 py-1.5 bg-black text-white text-sm rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Add New
              </button>
            </div>
            
            <div className="space-y-4">
              {billingAddresses.length > 0 ? (
                billingAddresses.map((address) => (
                  <div
                    key={address.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="font-medium text-gray-900">
                            {address.firstName} {address.lastName}
                          </p>
                          {address.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">{address.country}</p>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefault(address.id, 'billing')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">No billing addresses saved</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add addresses during checkout to save them for future orders
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {/* <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Address Management Tips
              </p>
              <p className="text-xs text-blue-700 mt-1">
                • Addresses are automatically saved when you check "Save this address" during checkout
                • Set default addresses to speed up future checkouts
                • You can have separate default addresses for shipping and billing
              </p>
            </div>
          </div>
        </div> */}

        {/* Address Form Modal */}
        {(editingAddress || addingAddressType) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingAddress ? 'Edit' : 'Add'} {editingAddress?.type || addingAddressType} Address
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={isFormLoading}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  <AddressForm
                    type={editingAddress?.type || addingAddressType!}
                    onSubmit={editingAddress ? handleUpdateAddress : handleSaveNewAddress}
                    editingAddress={editingAddress}
                    initialData={editingAddress ? {
                      firstName: editingAddress.firstName,
                      lastName: editingAddress.lastName,
                      addressLine1: editingAddress.addressLine1,
                      addressLine2: editingAddress.addressLine2 || undefined,
                      city: editingAddress.city,
                      state: editingAddress.state,
                      postalCode: editingAddress.postalCode,
                      country: editingAddress.country,
                      isDefault: editingAddress.isDefault || undefined,
                    } : undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}