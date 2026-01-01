'use client';

import { useAuth } from '@/components/providers/mock-auth-provider';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MockUserService } from '@/lib/data/mock-users';
import { isValidPostalCode } from '@/lib/amplify-client';
import type { Address } from '@/types';

// Prevent SSR for this page
export const dynamic = 'force-dynamic';

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    type: 'shipping' as 'shipping' | 'billing',
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (user?.userId) {
        try {
          const response = await MockUserService.getUserAddresses(user.userId);
          setAddresses(response.addresses);
        } catch (error) {
          console.error('Error loading addresses:', error);
          setError('Failed to load addresses');
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };

    if (user) {
      loadAddresses();
    }
  }, [user]);

  const resetForm = () => {
    setFormData({
      type: 'shipping',
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
    });
    setIsAddingAddress(false);
    setEditingAddress(null);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      type: address.type || 'shipping',
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault || false,
    });
    setEditingAddress(address);
    setIsAddingAddress(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    // Validate postal code
    if (!isValidPostalCode(formData.postalCode)) {
      setError('Please enter a valid postal code');
      setIsSaving(false);
      return;
    }

    try {
      if (!user?.userId) {
        throw new Error('User not found');
      }

      if (editingAddress) {
        // Update existing address
        await MockUserService.updateAddress(editingAddress.id, {
          type: formData.type,
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          isDefault: formData.isDefault,
        });
        setSuccess('Address updated successfully!');
      } else {
        // Create new address
        await MockUserService.createAddress(user.userId, {
          type: formData.type,
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          isDefault: formData.isDefault,
        });
        setSuccess('Address added successfully!');
      }

      // Reload addresses
      const response = await MockUserService.getUserAddresses(user.userId);
      setAddresses(response.addresses);
      
      resetForm();
    } catch (error: any) {
      console.error('Error saving address:', error);
      setError(error.message || 'Failed to save address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await MockUserService.deleteAddress(addressId);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      setSuccess('Address deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting address:', error);
      setError(error.message || 'Failed to delete address. Please try again.');
    }
  };

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Addresses</h1>
          </div>
          <p className="text-gray-600">Add and manage your shipping and billing addresses</p>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 text-green-600 text-sm bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}

        {/* Add Address Button */}
        {!isAddingAddress && !editingAddress && (
          <div className="mb-6">
            <button
              onClick={() => setIsAddingAddress(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Address
            </button>
          </div>
        )}

        {/* Address Form */}
        {(isAddingAddress || editingAddress) && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Address Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="shipping">Shipping Address</option>
                    <option value="billing">Billing Address</option>
                  </select>
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Address Lines */}
                <div>
                  <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    placeholder="Street address, P.O. Box, company name, c/o"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    id="addressLine2"
                    name="addressLine2"
                    type="text"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* City, State, Postal Code */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      id="state"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="India">India</option>
                  </select>
                </div>

                {/* Default Address */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Set as default {formData.type} address
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Addresses List */}
        <div className="space-y-4">
          {isLoadingAddresses ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : addresses.length > 0 ? (
            addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {address.type}
                      </span>
                      {address.isDefault && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-gray-900">
                      <p className="font-medium">{address.firstName} {address.lastName}</p>
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
              <p className="text-gray-600 mb-4">Add your first address to get started</p>
              <button
                onClick={() => setIsAddingAddress(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Address
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
  );
}