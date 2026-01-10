'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { validateCityStateWithPincode, type PincodeMatchResult } from '@/lib/services/pincode-service';
import { addressService, type SavedAddress, type AddressInput } from '@/lib/services/address-service';
import { useAuth } from '@/components/providers/auth-provider';
import { AddressSelector } from './AddressSelector';
import type { Address } from '@/types';

interface AddressFormProps {
  type: 'shipping' | 'billing';
  onSubmit: (address: Partial<Address>) => void;
  onBack?: () => void;
  sameAsShipping?: boolean;
  onSameAsShippingChange?: (same: boolean) => void;
  initialData?: Partial<Address> | null;
  editingAddress?: SavedAddress | null;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ValidationErrors extends Partial<FormData> {
  pincode?: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export function   AddressForm({ 
  type,
  onSubmit, 
  onBack,
  sameAsShipping, 
  onSameAsShippingChange, 
  initialData,
  editingAddress
}: AddressFormProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [showAddressSelector, setShowAddressSelector] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [previouslySelectedAddress, setPreviouslySelectedAddress] = useState<SavedAddress | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [hasMatchingBillingAddress, setHasMatchingBillingAddress] = useState(false);
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPincodeValidating, setIsPincodeValidating] = useState(false);
  const [pincodeMatchResult, setPincodeMatchResult] = useState<PincodeMatchResult | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Initialize form based on user authentication status
  useEffect(() => {
    // Wait for auth loading to complete before making decisions
    if (authLoading) {
      return;
    }

    if (editingAddress) {
      // If editing an address, show form directly with the address data
      setShowAddressSelector(false);
      setShowForm(true);
      setIsEditing(true);
      setEditingAddressId(editingAddress.id);
      const editFormData = {
        firstName: editingAddress.firstName || '',
        lastName: editingAddress.lastName || '',
        email: editingAddress.email || '',
        phone: editingAddress.phone || '',
        addressLine1: editingAddress.addressLine1 || '',
        addressLine2: editingAddress.addressLine2 || '',
        city: editingAddress.city || '',
        state: editingAddress.state || '',
        postalCode: editingAddress.postalCode || '',
        country: editingAddress.country || 'India',
      };
      setFormData(editFormData);
    } else if (!user) {
      // Guest user - show form directly
      setShowAddressSelector(false);
      setShowForm(true);
    } else {
      // Logged-in user - show address selector first
      setShowAddressSelector(true);
      setShowForm(false);
    }
  }, [user?.userId, editingAddress?.id, authLoading]);

  // Load initial data when provided
  useEffect(() => {
    if (initialData && !editingAddress) {
      const newFormData = {
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: (initialData as any).email || '',
        phone: (initialData as any).phone || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postalCode: initialData.postalCode || '',
        country: initialData.country || 'India',
      };
      setFormData(newFormData);
    }
  }, [initialData, editingAddress]);

  // Validate city/state with pincode when all three fields are filled
  const validateAddressMatch = useCallback(async (pincode: string, city: string, state: string) => {
    if (!pincode || !city || !state || pincode.length !== 6) {
      setPincodeMatchResult(null);
      return;
    }

    setIsPincodeValidating(true);
    setErrors(prev => ({ ...prev, postalCode: undefined, city: undefined, state: undefined }));

    try {
      const result = await validateCityStateWithPincode(pincode, city, state);
      setPincodeMatchResult(result);
      
      if (!result.matches && result.error) {
        setErrors(prev => ({ 
          ...prev, 
          postalCode: result.error
        }));
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setPincodeMatchResult(null);
      setErrors(prev => ({ 
        ...prev, 
        postalCode: 'Unable to validate address'
      }));
    } finally {
      setIsPincodeValidating(false);
    }
  }, []);

  // Debounce address validation
  useEffect(() => {
    if (formData.postalCode && formData.city && formData.state) {
      const timeoutId = setTimeout(() => {
        validateAddressMatch(formData.postalCode, formData.city, formData.state);
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setPincodeMatchResult(null);
    }
  }, [formData.postalCode, formData.city, formData.state, validateAddressMatch]);

  // Handle address selection
  const handleAddressSelect = (address: SavedAddress | null) => {
    setSelectedAddress(address);
    if (address) {
      // Use existing address
      setShowForm(false);
    } else {
      // Show form for new address
      setShowForm(true);
      setFormData(initialFormData);
      setTouchedFields(new Set()); // Reset touched fields
      setErrors({}); // Reset errors
    }
  };

  const handleNewAddress = () => {
    setSelectedAddress(null);
    setShowForm(true);
    setIsEditing(false);
    setFormData(initialFormData);
    setTouchedFields(new Set()); // Reset touched fields
    setErrors({}); // Reset errors
  };

  const handleEditAddress = (address: SavedAddress) => {
    setPreviouslySelectedAddress(selectedAddress); // Remember the currently selected address
    setSelectedAddress(null);
    setShowForm(true);
    setIsEditing(true);
    setEditingAddressId(address.id);
    
    // Check if this address already exists as a billing address
    checkForMatchingBillingAddress(address);
    
    const editFormData = {
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      email: address.email || '', // Load email from saved address
      phone: address.phone || '', // Load phone from saved address
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
    };
    setFormData(editFormData);
    setTouchedFields(new Set()); // Reset touched fields
    setErrors({}); // Reset errors
  };

  const checkForMatchingBillingAddress = async (shippingAddress: SavedAddress) => {
    if (!user?.userId) {
      setHasMatchingBillingAddress(false);
      return;
    }

    try {
      const billingAddresses = await addressService.getUserAddressesByType(user.userId, 'billing');
      
      // Check if any billing address matches this shipping address
      const hasMatch = billingAddresses.some(billingAddr => 
        billingAddr.addressLine1 === shippingAddress.addressLine1 &&
        billingAddr.city === shippingAddress.city &&
        billingAddr.state === shippingAddress.state &&
        billingAddr.postalCode === shippingAddress.postalCode &&
        billingAddr.firstName === shippingAddress.firstName &&
        billingAddr.lastName === shippingAddress.lastName
      );
      
      setHasMatchingBillingAddress(hasMatch);
    } catch (error) {
      console.error('Error checking for matching billing address:', error);
      setHasMatchingBillingAddress(false);
    }
  };

  const handleUseSelectedAddress = () => {
    if (selectedAddress) {
      const addressData: Partial<Address> = {
        type: type,
        firstName: selectedAddress.firstName,
        lastName: selectedAddress.lastName,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        isDefault: selectedAddress.isDefault,
        // Include email and phone for shipping addresses
        ...(type === 'shipping' && selectedAddress.email && { email: selectedAddress.email }),
        ...(type === 'shipping' && selectedAddress.phone && { phone: selectedAddress.phone }),
      };
      onSubmit(addressData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Define character limits for each field
    const limits = {
      firstName: 20,
      lastName: 20,
      email: 100,
      phone: 10,
      addressLine1: 100,
      addressLine2: 100,
      city: 20,
      postalCode: 6
    };
    
    let processedValue = value;
    
    // Special handling for specific fields
    if (name === 'postalCode') {
      // Only allow digits and limit to 6 characters
      processedValue = value.replace(/\D/g, '').slice(0, limits.postalCode);
    } else if (name === 'phone') {
      // Only allow digits and limit to 10 characters
      processedValue = value.replace(/\D/g, '').slice(0, limits.phone);
    } else if (name === 'firstName' || name === 'lastName') {
      // Limit character count for names
      processedValue = value.slice(0, limits[name as keyof typeof limits]);
    } else if (name === 'email') {
      // Limit character count for email
      processedValue = value.slice(0, limits.email);
    } else if (name === 'addressLine1' || name === 'addressLine2') {
      // Limit character count for address lines
      processedValue = value.slice(0, limits[name as keyof typeof limits]);
    } else if (name === 'city') {
      // Limit character count for city
      processedValue = value.slice(0, limits.city);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error when user starts typing (only if field was touched)
    if (touchedFields.has(name) && errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear pincode match result when user changes city/state/pincode
    if (name === 'city' || name === 'state' || name === 'postalCode') {
      setPincodeMatchResult(null);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    // Validate only this field after it's been touched
    validateSingleField(fieldName);
  };

  const validateSingleField = (fieldName: string) => {
    const newErrors = { ...errors };
    const value = formData[fieldName as keyof FormData];

    switch (fieldName) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = 'First name is required';
        } else if (value.trim().length < 2) {
          newErrors.firstName = 'First name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.firstName = 'First name can only contain letters and spaces';
        } else {
          delete newErrors.firstName;
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = 'Last name is required';
        } else if (value.trim().length < 2) {
          newErrors.lastName = 'Last name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          newErrors.lastName = 'Last name can only contain letters and spaces';
        } else {
          delete newErrors.lastName;
        }
        break;

      case 'email':
        if (type === 'shipping') { // Only validate email for shipping form
          if (!value.trim()) {
            newErrors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
            newErrors.email = 'Please enter a valid email address';
          } else {
            delete newErrors.email;
          }
        }
        break;

      case 'phone':
        if (type === 'shipping') { // Only validate phone for shipping form
          if (!value.trim()) {
            newErrors.phone = 'Phone number is required';
          } else if (!/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
          } else {
            delete newErrors.phone;
          }
        }
        break;

      case 'addressLine1':
        if (!value.trim()) {
          newErrors.addressLine1 = 'Address is required';
        } else if (value.trim().length < 5) {
          newErrors.addressLine1 = 'Please enter a complete address';
        } else {
          delete newErrors.addressLine1;
        }
        break;

      case 'city':
        if (!value.trim()) {
          newErrors.city = 'City is required';
        } else if (value.trim().length < 3) {
          newErrors.city = 'City name must be at least 3 characters';
        } else if (!/^[a-zA-Z\s\-\.]+$/.test(value.trim())) {
          newErrors.city = 'City name can only contain letters, spaces, hyphens, and dots';
        } else {
          delete newErrors.city;
        }
        break;

      case 'state':
        if (!value.trim()) {
          newErrors.state = 'State is required';
        } else {
          delete newErrors.state;
        }
        break;

      case 'postalCode':
        if (!value.trim()) {
          newErrors.postalCode = 'Pincode is required';
        } else if (!/^\d{6}$/.test(value)) {
          newErrors.postalCode = 'Please enter a valid 6-digit pincode';
        } else if (pincodeMatchResult && !pincodeMatchResult.matches) {
          newErrors.postalCode = pincodeMatchResult.error || 'City/State does not match pincode';
        } else {
          delete newErrors.postalCode;
        }
        break;

      case 'country':
        if (!value.trim()) {
          newErrors.country = 'Country is required';
        } else {
          delete newErrors.country;
        }
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters and spaces';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters and spaces';
    }

    // Email validation (only for shipping)
    if (type === 'shipping') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation (only for shipping)
    if (type === 'shipping') {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
      }
    }

    // Address validation
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    } else if (formData.addressLine1.trim().length < 5) {
      newErrors.addressLine1 = 'Please enter a complete address';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.trim().length < 3) {
      newErrors.city = 'City name must be at least 3 characters';
    } else if (!/^[a-zA-Z\s\-\.]+$/.test(formData.city.trim())) {
      newErrors.city = 'City name can only contain letters, spaces, hyphens, and dots';
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    // Pincode validation
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Please enter a valid 6-digit pincode';
    } else if (pincodeMatchResult && !pincodeMatchResult.matches) {
      newErrors.postalCode = pincodeMatchResult.error || 'City/State does not match pincode';
    }

    // Country validation
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  };

  // Check form validity whenever form data or validation results change
  useEffect(() => {
    validateForm();
  }, [formData, pincodeMatchResult, type]);

  // Save changes to existing address
  const handleSaveChanges = async () => {
    if (!validateForm() || !editingAddressId || !user) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const addressInput: AddressInput = {
        type: type,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: type === 'shipping' ? formData.email.trim() : undefined,
        phone: type === 'shipping' ? formData.phone.trim() : undefined,
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        isDefault: false,
      };

      const updatedAddress = await addressService.updateAddress(editingAddressId, addressInput);
      
      if (updatedAddress) {
        console.log(`✅ ${type} address updated successfully`);
        
        // Also submit the address data for checkout flow
        const addressData: Partial<Address> = {
          type: type,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim(),
          isDefault: false,
          // Include email and phone for shipping addresses
          ...(type === 'shipping' && formData.email && { email: formData.email.trim() }),
          ...(type === 'shipping' && formData.phone && { phone: formData.phone.trim() }),
        };

        onSubmit(addressData);
      } else {
        throw new Error('Failed to update address');
      }
    } catch (error) {
      console.error(`❌ Error updating ${type} address:`, error);
      // Still proceed with checkout even if saving fails
      const addressData: Partial<Address> = {
        type: type,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        isDefault: false,
        ...(type === 'shipping' && formData.email && { email: formData.email.trim() }),
        ...(type === 'shipping' && formData.phone && { phone: formData.phone.trim() }),
      };

      onSubmit(addressData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched on submit
    const allFields = Object.keys(formData);
    setTouchedFields(new Set(allFields));
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const addressData: Partial<Address> = {
        type: type,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim(),
        isDefault: false,
        // Add email and phone for shipping addresses (needed for order confirmation and SMS)
        ...(type === 'shipping' && formData.email && { email: formData.email.trim() }),
        ...(type === 'shipping' && formData.phone && { phone: formData.phone.trim() }),
      };

      // Save address for logged-in users if requested
      if (user && saveAddress) {
        const addressInput: AddressInput = {
          type: type,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: type === 'shipping' ? formData.email.trim() : undefined, // Only save email for shipping addresses
          phone: type === 'shipping' ? formData.phone.trim() : undefined, // Only save phone for shipping addresses
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim(),
          isDefault: false,
        };

        try {
          const savedAddress = await addressService.saveAddress(user.userId, addressInput);
          if (savedAddress) {
            console.log(`${type} address saved successfully`);
          }
        } catch (error) {
          console.error(`Error saving ${type} address:`, error);
          // Don't block checkout if address saving fails
        }
      }

      onSubmit(addressData);
    } catch (error) {
      console.error(`Error submitting ${type} form:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Show loading state while auth is loading */}
      {authLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {/* Address Selector for logged-in users */}
      {!authLoading && user && showAddressSelector && (
        <div>
          <AddressSelector
            type={type}
            onAddressSelect={handleAddressSelect}
            onNewAddress={handleNewAddress}
            onEditAddress={handleEditAddress}
            selectedAddressId={selectedAddress?.id}
          />
          
          {/* Continue button - show when address is selected */}
          {selectedAddress && (
            <div className="mt-4">
              {/* Same as shipping checkbox for shipping addresses */}
              {type === 'shipping' && onSameAsShippingChange && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start">
                    <input
                      id="sameAsShipping"
                      type="checkbox"
                      checked={sameAsShipping || false}
                      onChange={(e) => onSameAsShippingChange(e.target.checked)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="sameAsShipping" className="block text-sm font-medium text-gray-700">
                        Use this address for billing
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {sameAsShipping 
                          ? "Your billing address will be the same as your shipping address" 
                          : "You'll be asked to enter a separate billing address on the next step"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <div className="flex space-x-4">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Back to {type === 'billing' ? 'Shipping' : 'Cart'}
                    </button>
                  )}
                  
                  <button
                    onClick={handleUseSelectedAddress}
                    className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
                  >
                    {type === 'shipping' 
                      ? (sameAsShipping ? 'Continue to Review' : 'Continue to Billing')
                      : 'Review Order'
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Address Form */}
      {!authLoading && showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing 
                ? `Edit ${type === 'shipping' ? 'Shipping' : 'Billing'} Address`
                : user && selectedAddress === null 
                  ? `Add New ${type === 'shipping' ? 'Shipping' : 'Billing'} Address` 
                  : `${type === 'shipping' ? 'Shipping' : 'Billing'} Address`
              }
            </h2>
            {user && showAddressSelector && (
              <button
                onClick={() => {
                  setShowForm(false);
                  setShowAddressSelector(true);
                  setIsEditing(false);
                  setEditingAddressId(null);
                  setHasMatchingBillingAddress(false);
                  // Restore the previously selected address if we were editing
                  if (isEditing && previouslySelectedAddress) {
                    setSelectedAddress(previouslySelectedAddress);
                    setPreviouslySelectedAddress(null);
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to saved addresses
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('firstName')}
                  maxLength={20}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                    touchedFields.has('firstName') && errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your first name"
                />
                {touchedFields.has('firstName') && errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{formData.firstName.length}/20 characters</p>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('lastName')}
                  maxLength={20}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                    touchedFields.has('lastName') && errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your last name"
                />
                {touchedFields.has('lastName') && errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{formData.lastName.length}/20 characters</p>
              </div>
            </div>

            {/* Email field for shipping form only - required for order confirmation */}
            {type === 'shipping' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('email')}
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                    touchedFields.has('email') && errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
                {touchedFields.has('email') && errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  We'll send your order confirmation and updates to this email address ({formData.email.length}/100 characters)
                </p>
              </div>
            )}

            {/* Phone field for shipping form only - required for SMS notifications */}
            {type === 'shipping' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('phone')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                    touchedFields.has('phone') && errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your 10-digit mobile number"
                  maxLength={10}
                />
                {touchedFields.has('phone') && errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  We'll send you SMS updates about your order status and delivery ({formData.phone.length}/10 digits)
                </p>
              </div>
            )}

            {/* Address fields */}
            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('addressLine1')}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                  touchedFields.has('addressLine1') && errors.addressLine1 ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Street address, P.O. Box, company name"
              />
              {touchedFields.has('addressLine1') && errors.addressLine1 && (
                <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{formData.addressLine1.length}/100 characters</p>
            </div>

            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
              <p className="mt-1 text-xs text-gray-500">{formData.addressLine2.length}/100 characters</p>
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('city')}
                  maxLength={20}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                    (touchedFields.has('city') && errors.city) || pincodeMatchResult?.cityMatch === false ? 'border-red-300' : 
                    pincodeMatchResult?.cityMatch === true ? 'border-green-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete city name (e.g., Mumbai, Bangalore)"
                />
                {touchedFields.has('city') && errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
                {pincodeMatchResult?.cityMatch === true && !errors.city && (
                  <p className="mt-1 text-sm text-green-600">✓ City matches pincode</p>
                )}
                <p className="mt-1 text-xs text-gray-500">{formData.city.length}/20 characters</p>
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('state')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                    (touchedFields.has('state') && errors.state) || pincodeMatchResult?.stateMatch === false ? 'border-red-300' : 
                    pincodeMatchResult?.stateMatch === true ? 'border-green-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select State</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {touchedFields.has('state') && errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
                {pincodeMatchResult?.stateMatch === true && !errors.state && (
                  <p className="mt-1 text-sm text-green-600">✓ State matches pincode</p>
                )}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('postalCode')}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                      (touchedFields.has('postalCode') && errors.postalCode) ? 'border-red-300' : 
                      pincodeMatchResult?.matches === true ? 'border-green-300' : 'border-gray-300'
                    }`}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                  />
                  {isPincodeValidating && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    </div>
                  )}
                  {pincodeMatchResult?.matches === true && !isPincodeValidating && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {touchedFields.has('postalCode') && errors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                )}
                {pincodeMatchResult?.matches === true && !errors.postalCode && (
                  <p className="mt-1 text-sm text-green-600">
                    ✓ Address verified for {pincodeMatchResult.data?.city}, {pincodeMatchResult.data?.state}
                  </p>
                )}
                {formData.postalCode && formData.city && formData.state && !isPincodeValidating && !pincodeMatchResult && (
                  <p className="mt-1 text-sm text-gray-500">
                    Validating address...
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">{formData.postalCode.length}/6 digits</p>
              </div>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('country')}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                  touchedFields.has('country') && errors.country ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="India">India</option>
              </select>
              {touchedFields.has('country') && errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country}</p>
              )}
            </div>

            {/* Save address option for logged-in users - only show when creating a completely new address */}
            {user && !isEditing && !selectedAddress && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start">
                  <input
                    id="saveAddress"
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
                  />
                  <div className="ml-3">
                    <label htmlFor="saveAddress" className="block text-sm font-medium text-gray-700">
                      Save this address for future orders
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      We'll securely store this address in your account for faster checkout next time
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Same as shipping checkbox (only for shipping form) */}
            {type === 'shipping' && onSameAsShippingChange && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-start">
                  <input
                    id="sameAsShipping"
                    type="checkbox"
                    checked={sameAsShipping || false}
                    onChange={(e) => onSameAsShippingChange(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded mt-1"
                  />
                  <div className="ml-3">
                    <label htmlFor="sameAsShipping" className="block text-sm font-medium text-gray-700">
                      Use this address for billing
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {isEditing && hasMatchingBillingAddress ? (
                        "You already have this address saved as a billing address"
                      ) : sameAsShipping ? (
                        "Your billing address will be the same as your shipping address" 
                      ) : (
                        "You'll be asked to enter a separate billing address on the next step"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex justify-end pt-6">
              <div className="flex space-x-4">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Back to {type === 'billing' ? 'Shipping' : 'Cart'}
                  </button>
                )}
                
                {isEditing ? (
                  // When editing an existing address, show "Save Changes" button
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isSubmitting || isPincodeValidating || !isFormValid}
                    className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Saving Changes...' : 
                     isPincodeValidating ? 'Validating...' :
                     'Save Changes & Continue'
                    }
                  </button>
                ) : (
                  // When creating new address or using form normally
                  <button
                    type="submit"
                    disabled={isSubmitting || isPincodeValidating || !isFormValid}
                    className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : 
                     isPincodeValidating ? 'Validating...' :
                     type === 'shipping' 
                       ? (sameAsShipping ? 'Continue to Review' : 'Continue to Billing')
                       : 'Review Order'
                    }
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}