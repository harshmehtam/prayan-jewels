'use client';

import { useState, useEffect, useCallback } from 'react';
import * as addressActions from '@/app/actions/address-actions';
import type { SavedAddress } from '@/lib/services/address-service';
import { useUser } from '@/hooks/use-user';

interface AddressSelectorProps {
  type: 'shipping' | 'billing';
  onAddressSelect: (address: SavedAddress | null) => void;
  onNewAddress: () => void;
  onEditAddress?: (address: SavedAddress) => void;
  selectedAddressId?: string | null;
}

export function AddressSelector({ 
  type, 
  onAddressSelect, 
  onNewAddress, 
  onEditAddress,
  selectedAddressId 
}: AddressSelectorProps) {
  const { user } = useUser();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(selectedAddressId || null);

  const loadAddresses = useCallback(async () => {
    if (!user?.userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const userAddresses = await addressActions.getUserAddressesByType(user.userId, type);
      setAddresses(userAddresses);

      // Auto-select default address if no address is currently selected
      if (!selectedId && userAddresses.length > 0) {
        const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        setSelectedId(defaultAddress.id);
        onAddressSelect(defaultAddress);
      }
    } catch (error) {
      console.error(`Error loading ${type} addresses:`, error);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, type, selectedId, onAddressSelect]);

  // Load addresses when component mounts or type changes
  useEffect(() => {
    setAddresses([]);
    setSelectedId(null);
    loadAddresses();
  }, [type, user?.userId, loadAddresses]);

  const handleAddressSelect = (address: SavedAddress) => {
    setSelectedId(address.id);
    onAddressSelect(address);
  };

  const handleNewAddress = () => {
    setSelectedId(null);
    onAddressSelect(null);
    onNewAddress();
  };

  const handleDeleteAddress = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const success = await addressActions.deleteAddress(addressId);
      if (success) {
        await loadAddresses();
        
        if (selectedId === addressId) {
          setSelectedId(null);
          onAddressSelect(null);
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefault = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Select {type === 'shipping' ? 'Shipping' : 'Billing'} Address
      </h2>

      <div className="space-y-4">
        {addresses.length > 0 && (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedId === address.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name={`${type}-address`}
                      checked={selectedId === address.id}
                      onChange={() => handleAddressSelect(address)}
                      className="mt-1 h-4 w-4 text-black focus:ring-black border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {address.firstName} {address.lastName}
                        </p>
                        {address.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!address.isDefault && (
                      <button
                        onClick={(e) => handleSetDefault(address.id, e)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        title="Set as default"
                      >
                        Set Default
                      </button>
                    )}
                    {onEditAddress && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAddress(address);
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800"
                        title="Edit address"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteAddress(address.id, e)}
                      className="text-xs text-red-600 hover:text-red-800"
                      title="Delete address"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new address option */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
            selectedId === null
              ? 'border-black bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={handleNewAddress}
        >
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              name={`${type}-address`}
              checked={selectedId === null}
              onChange={handleNewAddress}
              className="h-4 w-4 text-black focus:ring-black border-gray-300"
            />
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-gray-700 font-medium">
                Add new {type} address
              </span>
            </div>
          </div>
        </div>

        {addresses.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No saved {type} addresses found. Add your first {type} address below.
          </p>
        )}
      </div>
    </div>
  );
}