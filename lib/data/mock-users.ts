// Mock user profile and address data
import type { Address } from '@/types';

// Mock addresses data
const mockAddresses: Address[] = [
  {
    id: 'addr-1',
    userId: 'user-1',
    type: 'shipping',
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'addr-2',
    userId: 'user-1',
    type: 'billing',
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '456 Business District',
    addressLine2: 'Office 12A',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400002',
    country: 'India',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'addr-3',
    userId: 'user-2',
    type: 'shipping',
    firstName: 'Admin',
    lastName: 'User',
    addressLine1: '789 Admin Lane',
    addressLine2: '',
    city: 'Delhi',
    state: 'Delhi',
    postalCode: '110001',
    country: 'India',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
];

export class MockUserService {
  // Get user profile by user ID
  static async getUserProfile(userId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // This would normally fetch from the auth provider's user data
    // For now, we'll return null since profiles are managed in the auth provider
    return {
      profile: null,
      errors: null
    };
  }

  // Create user profile
  static async createUserProfile(userId: string, profileData: any) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In mock mode, profiles are managed by the auth provider
    return {
      profile: null,
      errors: null
    };
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: any) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    // In mock mode, profiles are managed by the auth provider
    return {
      profile: null,
      errors: null
    };
  }

  // Get user addresses
  static async getUserAddresses(userId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const userAddresses = mockAddresses.filter(addr => addr.userId === userId);

    return {
      addresses: userAddresses,
      errors: null
    };
  }

  // Create user address
  static async createAddress(userId: string, addressData: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // If this is set as default, unset other default addresses of the same type
    if (addressData.isDefault && addressData.type) {
      await this.unsetDefaultAddresses(userId, addressData.type);
    }

    const newAddress: Address = {
      ...addressData,
      id: `addr-${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to mock data
    mockAddresses.push(newAddress);

    return {
      address: newAddress,
      errors: null
    };
  }

  // Update address
  static async updateAddress(addressId: string, updates: Partial<Address>) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const addressIndex = mockAddresses.findIndex(addr => addr.id === addressId);
    
    if (addressIndex === -1) {
      throw new Error('Address not found');
    }

    const existingAddress = mockAddresses[addressIndex];

    // If setting as default, unset other defaults of the same type
    if (updates.isDefault && updates.type) {
      await this.unsetDefaultAddresses(existingAddress.userId, updates.type);
    }

    // Update the address
    mockAddresses[addressIndex] = {
      ...existingAddress,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return {
      address: mockAddresses[addressIndex],
      errors: null
    };
  }

  // Delete address
  static async deleteAddress(addressId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const addressIndex = mockAddresses.findIndex(addr => addr.id === addressId);
    
    if (addressIndex !== -1) {
      mockAddresses.splice(addressIndex, 1);
    }

    return {
      success: true,
      errors: null
    };
  }

  // Get default address by type
  static async getDefaultAddress(userId: string, type: 'shipping' | 'billing') {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const defaultAddress = mockAddresses.find(addr => 
      addr.userId === userId && 
      addr.type === type && 
      addr.isDefault
    );

    return {
      address: defaultAddress || null,
      errors: null
    };
  }

  // Helper method to unset default addresses of a specific type
  private static async unsetDefaultAddresses(userId: string, type: 'shipping' | 'billing') {
    const addressesToUpdate = mockAddresses.filter(addr => 
      addr.userId === userId && 
      addr.type === type && 
      addr.isDefault
    );

    addressesToUpdate.forEach(addr => {
      addr.isDefault = false;
      addr.updatedAt = new Date().toISOString();
    });
  }

  // Check if user has admin role
  static async isAdmin(userId: string) {
    // In mock mode, check the mock users data from auth provider
    return userId === 'user-2'; // admin@example.com
  }

  // Check if user has super admin role
  static async isSuperAdmin(userId: string) {
    // In mock mode, no super admin for simplicity
    return false;
  }
}