import { cookiesClient } from '@/utils/amplify-utils';

export interface AddressInput {
  type: 'shipping' | 'billing';
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
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
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to transform address data
const transformAddress = (addr: any): SavedAddress => ({
  id: addr.id,
  userId: addr.userId,
  type: addr.type as 'shipping' | 'billing',
  firstName: addr.firstName || '',
  lastName: addr.lastName || '',
  email: addr.email || '',
  phone: addr.phone || '',
  addressLine1: addr.addressLine1 || '',
  addressLine2: addr.addressLine2 || undefined,
  city: addr.city || '',
  state: addr.state || '',
  postalCode: addr.postalCode || '',
  country: addr.country || 'India',
  isDefault: addr.isDefault || false,
  createdAt: addr.createdAt,
  updatedAt: addr.updatedAt,
});

/**
 * Get all addresses for a user
 */
export async function getUserAddresses(userId: string): Promise<SavedAddress[]> {
  try {
    const client = await cookiesClient;
    const { data: addresses, errors } = await client.models.Address.list({
      filter: { userId: { eq: userId } },
      authMode: 'userPool'
    });

    if (errors) {
      console.error('Error fetching addresses:', errors);
      return [];
    }

    if (!addresses || addresses.length === 0) {
      return [];
    }

    return addresses
      .filter(addr => addr !== null)
      .map(transformAddress);
  } catch (error) {
    console.error('Error fetching user addresses:', error);
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
    const client = await cookiesClient;
    const { data: addresses, errors } = await client.models.Address.list({
      filter: { 
        and: [
          { userId: { eq: userId } },
          { type: { eq: type } }
        ]
      },
      authMode: 'userPool'
    });

    if (errors) {
      console.error('Error fetching addresses by type:', errors);
      return [];
    }

    if (!addresses || addresses.length === 0) {
      return [];
    }

    return addresses
      .filter(addr => addr !== null)
      .map(transformAddress);
  } catch (error) {
    console.error('Error fetching addresses by type:', error);
    return [];
  }
}

/**
 * Check if an address already exists for a user (to prevent duplicates)
 */
export async function findDuplicateAddress(
  userId: string, 
  address: AddressInput
): Promise<SavedAddress | null> {
  try {
    const addresses = await getUserAddressesByType(userId, address.type);
    
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
 * Unset all default addresses of a specific type for a user
 */
async function unsetDefaultAddresses(userId: string, type: 'shipping' | 'billing'): Promise<void> {
  try {
    const addresses = await getUserAddressesByType(userId, type);
    const defaultAddresses = addresses.filter(addr => addr.isDefault);

    if (defaultAddresses.length === 0) return;

    const client = await cookiesClient;

    // Update all default addresses to not default
    await Promise.all(
      defaultAddresses.map(address =>
        client.models.Address.update({
          id: address.id,
          isDefault: false,
        }, {
          authMode: 'userPool'
        })
      )
    );
  } catch (error) {
    console.error('Error unsetting default addresses:', error);
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
    // Check for duplicates first
    const duplicate = await findDuplicateAddress(userId, address);
    if (duplicate) {
      return duplicate;
    }

    // If this is set as default, unset other defaults of the same type
    if (address.isDefault) {
      await unsetDefaultAddresses(userId, address.type);
    }

    const client = await cookiesClient;
    const { data: newAddress, errors } = await client.models.Address.create({
      userId,
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault || false,
    }, {
      authMode: 'userPool'
    });

    if (errors || !newAddress) {
      console.error('Error saving address:', errors);
      return null;
    }

    return transformAddress(newAddress);
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
    // If setting as default, we need to get the address first to know its type and userId
    if (updates.isDefault) {
      const client = await cookiesClient;
      const { data: existingAddress } = await client.models.Address.get(
        { id: addressId },
        { authMode: 'userPool' }
      );

      if (existingAddress) {
        await unsetDefaultAddresses(
          existingAddress.userId, 
          existingAddress.type as 'shipping' | 'billing'
        );
      }
    }

    const client = await cookiesClient;
    const { data: updatedAddress, errors } = await client.models.Address.update({
      id: addressId,
      ...updates,
    }, {
      authMode: 'userPool'
    });

    if (errors || !updatedAddress) {
      console.error('Error updating address:', errors);
      return null;
    }

    return transformAddress(updatedAddress);
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
    const client = await cookiesClient;
    const { errors } = await client.models.Address.delete(
      { id: addressId },
      { authMode: 'userPool' }
    );
    
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
export async function setDefaultAddress(
  userId: string, 
  addressId: string, 
  type: 'shipping' | 'billing'
): Promise<boolean> {
  try {
    // First, unset all defaults of this type
    await unsetDefaultAddresses(userId, type);

    // Then set the specified address as default
    const client = await cookiesClient;
    const { errors } = await client.models.Address.update({
      id: addressId,
      isDefault: true,
    }, {
      authMode: 'userPool'
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
 * Get default address for a user by type
 */
export async function getDefaultAddress(
  userId: string, 
  type: 'shipping' | 'billing'
): Promise<SavedAddress | null> {
  try {
    const addresses = await getUserAddressesByType(userId, type);
    return addresses.find(addr => addr.isDefault) || null;
  } catch (error) {
    console.error('Error getting default address:', error);
    return null;
  }
}

/**
 * Format address for display
 */
export function formatAddressForDisplay(address: SavedAddress): string {
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
export function toAddressInput(address: SavedAddress): AddressInput {
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

// Legacy aliases for backward compatibility (deprecated)
/** @deprecated Use saveAddress instead */
export const saveUserAddress = saveAddress;