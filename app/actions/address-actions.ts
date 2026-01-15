'use server';

import { revalidatePath } from 'next/cache';
import * as addressService from '@/lib/services/address-service';
import type { SavedAddress, AddressInput } from '@/lib/services/address-service';

/**
 * Get all addresses for a user
 */
export async function getUserAddresses(userId: string): Promise<SavedAddress[]> {
  try {
    return await addressService.getUserAddresses(userId);
  } catch (error) {
    console.error('Error getting user addresses:', error);
    return [];
  }
}

/**
 * Get addresses by type for a user
 */
export async function getUserAddressesByType(
  userId: string,
  type: 'shipping' | 'billing'
): Promise<SavedAddress[]> {
  try {
    return await addressService.getUserAddressesByType(userId, type);
  } catch (error) {
    console.error('Error getting user addresses by type:', error);
    return [];
  }
}

/**
 * Check if an address already exists (to prevent duplicates)
 */
export async function findDuplicateAddress(
  userId: string,
  address: AddressInput
): Promise<SavedAddress | null> {
  try {
    return await addressService.findDuplicateAddress(userId, address);
  } catch (error) {
    console.error('Error checking for duplicate address:', error);
    return null;
  }
}

/**
 * Save a new address for a user
 */
export async function saveAddress(
  userId: string,
  address: AddressInput
): Promise<SavedAddress | null> {
  try {
    const result = await addressService.saveAddress(userId, address);
    
    if (result) {
      revalidatePath('/account/addresses');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error saving address:', error);
    return null;
  }
}

/**
 * Update an existing address
 */
export async function updateAddress(
  addressId: string,
  updates: Partial<AddressInput>
): Promise<SavedAddress | null> {
  try {
    const result = await addressService.updateAddress(addressId, updates);
    
    if (result) {
      revalidatePath('/account/addresses');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error updating address:', error);
    return null;
  }
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string): Promise<boolean> {
  try {
    const result = await addressService.deleteAddress(addressId);
    
    if (result) {
      revalidatePath('/account/addresses');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting address:', error);
    return false;
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(
  userId: string,
  addressId: string,
  type: 'shipping' | 'billing'
): Promise<boolean> {
  try {
    const result = await addressService.setDefaultAddress(userId, addressId, type);
    
    if (result) {
      revalidatePath('/account/addresses');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error setting default address:', error);
    return false;
  }
}

/**
 * Get default address for a user by type
 */
export async function getDefaultAddress(
  userId: string,
  type: 'shipping' | 'billing'
): Promise<SavedAddress | null> {
  try {
    return await addressService.getDefaultAddress(userId, type);
  } catch (error) {
    console.error('Error getting default address:', error);
    return null;
  }
}
