import { getClient, client } from '@/lib/amplify-client';
import type { Schema } from '@/amplify/data/resource';
import type { Address } from '@/types';

export interface AddressInput {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  email?: string; // Optional in input, will be converted to empty string if not provided
  phone?: string; // Optional in input, will be converted to empty string if not provided
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface SavedAddress extends AddressInput {
  id: string;
  userId: string;
  email: string; // Always a string (empty if not provided)
  phone: string; // Always a string (empty if not provided)
  createdAt: string;
  updatedAt: string;
}

class AddressService {
  /**
   * Get all addresses for a user
   */
  async getUserAddresses(userId: string): Promise<SavedAddress[]> {
    try {
      const { data: addresses, errors } = await client.models.Address.list({
        filter: { userId: { eq: userId } }
      });

      if (errors) {
        console.error('Error fetching addresses:', errors);
        return [];
      }

      // Handle the case where addresses might be null or have null fields
      if (!addresses || addresses.length === 0) {
        return [];
      }

      return addresses
        .filter(addr => addr !== null) // Filter out any null addresses
        .map(addr => ({
          id: addr.id,
          userId: addr.userId,
          type: addr.type as 'shipping' | 'billing',
          firstName: addr.firstName || '',
          lastName: addr.lastName || '',
          email: addr.email || '', // Convert null to empty string
          phone: addr.phone || '', // Convert null to empty string
          addressLine1: addr.addressLine1 || '',
          addressLine2: addr.addressLine2 || undefined,
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || 'India',
          isDefault: addr.isDefault || false,
          createdAt: addr.createdAt,
          updatedAt: addr.updatedAt,
        }));
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      return [];
    }
  }

  /**
   * Get addresses by type for a user
   */
  async getUserAddressesByType(userId: string, type: 'shipping' | 'billing'): Promise<SavedAddress[]> {
    try {
      const { data: addresses, errors } = await client.models.Address.list({
        filter: { 
          userId: { eq: userId },
          type: { eq: type }
        }
      });

      if (errors) {
        console.error('Error fetching addresses by type:', errors);
        return [];
      }

      // Handle the case where addresses might be null or have null fields
      if (!addresses || addresses.length === 0) {
        return [];
      }

      return addresses
        .filter(addr => addr !== null) // Filter out any null addresses
        .map(addr => ({
          id: addr.id,
          userId: addr.userId,
          type: addr.type as 'shipping' | 'billing',
          firstName: addr.firstName || '',
          lastName: addr.lastName || '',
          email: addr.email || '', // Convert null to empty string
          phone: addr.phone || '', // Convert null to empty string
          addressLine1: addr.addressLine1 || '',
          addressLine2: addr.addressLine2 || undefined,
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || 'India',
          isDefault: addr.isDefault || false,
          createdAt: addr.createdAt,
          updatedAt: addr.updatedAt,
        }));
    } catch (error) {
      console.error('Error fetching addresses by type:', error);
      return [];
    }
  }

  /**
   * Check if an address already exists for a user (to prevent duplicates)
   */
  async findDuplicateAddress(userId: string, address: AddressInput): Promise<SavedAddress | null> {
    try {
      const addresses = await this.getUserAddressesByType(userId, address.type);
      
      const duplicate = addresses.find(existing => 
        existing.firstName.toLowerCase() === address.firstName.toLowerCase() &&
        existing.lastName.toLowerCase() === address.lastName.toLowerCase() &&
        existing.addressLine1.toLowerCase() === address.addressLine1.toLowerCase() &&
        (existing.addressLine2 || '').toLowerCase() === (address.addressLine2 || '').toLowerCase() &&
        existing.city.toLowerCase() === address.city.toLowerCase() &&
        existing.state.toLowerCase() === address.state.toLowerCase() &&
        existing.postalCode === address.postalCode &&
        existing.country.toLowerCase() === address.country.toLowerCase()
      );

      return duplicate || null;
    } catch (error) {
      console.error('Error checking for duplicate address:', error);
      return null;
    }
  }

  /**
   * Save a new address for a user
   */
  async saveAddress(userId: string, address: AddressInput): Promise<SavedAddress | null> {
    try {
      // Check for duplicates first
      const duplicate = await this.findDuplicateAddress(userId, address);
      if (duplicate) {
        return duplicate;
      }

      // If this is set as default, unset other defaults of the same type
      if (address.isDefault) {
        await this.unsetDefaultAddresses(userId, address.type);
      }

      const { data: newAddress, errors } = await client.models.Address.create({
        userId,
        type: address.type,
        firstName: address.firstName,
        lastName: address.lastName,
        email: address.email || '', // Provide empty string if not provided
        phone: address.phone || '', // Provide empty string if not provided
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault || false,
      });

      if (errors || !newAddress) {
        console.error('Error saving address:', errors);
        return null;
      }

      return {
        id: newAddress.id,
        userId: newAddress.userId,
        type: newAddress.type as 'shipping' | 'billing',
        firstName: newAddress.firstName,
        lastName: newAddress.lastName,
        email: newAddress.email || '', // Convert null to empty string
        phone: newAddress.phone || '', // Convert null to empty string
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2 || undefined,
        city: newAddress.city,
        state: newAddress.state,
        postalCode: newAddress.postalCode,
        country: newAddress.country,
        isDefault: newAddress.isDefault || false,
        createdAt: newAddress.createdAt,
        updatedAt: newAddress.updatedAt,
      };
    } catch (error) {
      console.error('Error saving address:', error);
      return null;
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId: string, updates: Partial<AddressInput>): Promise<SavedAddress | null> {
    try {
      const { data: updatedAddress, errors } = await client.models.Address.update({
        id: addressId,
        ...updates,
      });

      if (errors || !updatedAddress) {
        console.error('Error updating address:', errors);
        return null;
      }

      return {
        id: updatedAddress.id,
        userId: updatedAddress.userId,
        type: updatedAddress.type as 'shipping' | 'billing',
        firstName: updatedAddress.firstName,
        lastName: updatedAddress.lastName,
        email: updatedAddress.email || '', // Convert null to empty string
        phone: updatedAddress.phone || '', // Convert null to empty string
        addressLine1: updatedAddress.addressLine1,
        addressLine2: updatedAddress.addressLine2 || undefined,
        city: updatedAddress.city,
        state: updatedAddress.state,
        postalCode: updatedAddress.postalCode,
        country: updatedAddress.country,
        isDefault: updatedAddress.isDefault || false,
        createdAt: updatedAddress.createdAt,
        updatedAt: updatedAddress.updatedAt,
      };
    } catch (error) {
      console.error('Error updating address:', error);
      return null;
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<boolean> {
    try {
      const { errors } = await client.models.Address.delete({ id: addressId });
      
      if (errors) {
        console.error('Error deleting address:', errors);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      return false;
    }
  }

  /**
   * Set an address as default (and unset others of the same type)
   */
  async setDefaultAddress(userId: string, addressId: string, type: 'shipping' | 'billing'): Promise<boolean> {
    try {
      // First, unset all defaults of this type
      await this.unsetDefaultAddresses(userId, type);

      // Then set the specified address as default
      const { errors } = await client.models.Address.update({
        id: addressId,
        isDefault: true,
      });

      if (errors) {
        console.error('Error setting default address:', errors);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting default address:', error);
      return false;
    }
  }

  /**
   * Unset all default addresses of a specific type for a user
   */
  private async unsetDefaultAddresses(userId: string, type: 'shipping' | 'billing'): Promise<void> {
    try {
      const addresses = await this.getUserAddressesByType(userId, type);
      const defaultAddresses = addresses.filter(addr => addr.isDefault);

      for (const address of defaultAddresses) {
        await client.models.Address.update({
          id: address.id,
          isDefault: false,
        });
      }
    } catch (error) {
      console.error('Error unsetting default addresses:', error);
    }
  }

  /**
   * Get default address for a user by type
   */
  async getDefaultAddress(userId: string, type: 'shipping' | 'billing'): Promise<SavedAddress | null> {
    try {
      const addresses = await this.getUserAddressesByType(userId, type);
      return addresses.find(addr => addr.isDefault) || null;
    } catch (error) {
      console.error('Error getting default address:', error);
      return null;
    }
  }

  /**
   * Format address for display
   */
  formatAddressForDisplay(address: SavedAddress): string {
    const parts = [
      `${address.firstName} ${address.lastName}`,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Convert SavedAddress to AddressInput
   */
  toAddressInput(address: SavedAddress): AddressInput {
    return {
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    };
  }
}

// Export singleton instance
export const addressService = new AddressService();

// Export utility functions
export const getUserAddresses = (userId: string) => addressService.getUserAddresses(userId);
export const saveUserAddress = (userId: string, address: AddressInput) => addressService.saveAddress(userId, address);
export const findDuplicateAddress = (userId: string, address: AddressInput) => addressService.findDuplicateAddress(userId, address);