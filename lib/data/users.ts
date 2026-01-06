// User profile data access layer
import { client, handleAmplifyError } from '@/lib/amplify-client';
import type { UserProfile, Address } from '@/types';

export class UserService {
  // Get user profile by user ID
  // With owner-based authorization, users can only fetch their own profile
  static async getUserProfile(userId: string) {
    try {
      const response = await client.models.UserProfile.list({
        limit: 1,
        authMode: 'userPool'
      });

      return {
        profile: response.data?.[0] || null,
        errors: response.errors
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(handleAmplifyError(error));
    }
  }

  // Create user profile
  static async createUserProfile(userId: string, profileData: Partial<UserProfile>) {
    try {
      const response = await client.models.UserProfile.create({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        newsletter: profileData.newsletter ?? false,
        smsUpdates: profileData.smsUpdates ?? false,
        preferredCategories: profileData.preferredCategories || [],
        role: profileData.role || 'customer'
      });

      return {
        profile: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      // With owner-based auth, we need to get the profile first to get the auto-generated ID
      // This is unavoidable with the current Amplify Gen2 owner-based model structure
      const existingProfile = await this.getUserProfile(userId);
      
      if (!existingProfile.profile) {
        throw new Error('User profile not found');
      }

      const response = await client.models.UserProfile.update({
        id: existingProfile.profile.id,
        ...updates
      });

      return {
        profile: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get user addresses
  static async getUserAddresses(userId: string) {
    try {
      const response = await client.models.Address.list({
        filter: {
          userId: { eq: userId }
        }
      });

      return {
        addresses: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Create user address
  static async createAddress(userId: string, addressData: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    try {
      // If this is set as default, unset other default addresses of the same type
      if (addressData.isDefault && addressData.type) {
        await this.unsetDefaultAddresses(userId, addressData.type);
      }

      const response = await client.models.Address.create({
        userId,
        ...addressData
      });

      return {
        address: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update address
  static async updateAddress(addressId: string, updates: Partial<Address>) {
    try {
      // If setting as default, unset other defaults of the same type
      if (updates.isDefault && updates.type) {
        const addressResponse = await client.models.Address.get({ id: addressId });
        if (addressResponse.data?.userId) {
          await this.unsetDefaultAddresses(addressResponse.data.userId, updates.type);
        }
      }

      const response = await client.models.Address.update({
        id: addressId,
        ...updates
      });

      return {
        address: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Delete address
  static async deleteAddress(addressId: string) {
    try {
      const response = await client.models.Address.delete({ id: addressId });

      return {
        success: true,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get default address by type
  static async getDefaultAddress(userId: string, type: 'shipping' | 'billing') {
    try {
      const response = await client.models.Address.list({
        filter: {
          and: [
            { userId: { eq: userId } },
            { type: { eq: type } },
            { isDefault: { eq: true } }
          ]
        }
      });

      return {
        address: response.data?.[0] || null,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Helper method to unset default addresses of a specific type
  private static async unsetDefaultAddresses(userId: string, type: 'shipping' | 'billing') {
    try {
      const response = await client.models.Address.list({
        filter: {
          and: [
            { userId: { eq: userId } },
            { type: { eq: type } },
            { isDefault: { eq: true } }
          ]
        }
      });

      // Update all default addresses of this type to not be default
      const updatePromises = response.data?.map(address =>
        client.models.Address.update({
          id: address.id,
          isDefault: false
        })
      ) || [];

      await Promise.all(updatePromises);
    } catch (error) {
      // Log error but don't throw - this is a helper operation
      console.error('Error unsetting default addresses:', error);
    }
  }

  // Check if user has admin role
  static async isAdmin(userId: string) {
    try {
      const profileResponse = await this.getUserProfile(userId);
      return profileResponse.profile?.role === 'admin' || profileResponse.profile?.role === 'super_admin';
    } catch (error) {
      return false;
    }
  }

  // Check if user has super admin role
  static async isSuperAdmin(userId: string) {
    try {
      const profileResponse = await this.getUserProfile(userId);
      return profileResponse.profile?.role === 'super_admin';
    } catch (error) {
      return false;
    }
  }

  // Update user role (super admin only)
  static async updateUserRole(
    userId: string, 
    newRole: 'customer' | 'admin' | 'super_admin',
    updatedBy: string
  ) {
    try {
      // First check if the updater has permission
      const updaterProfile = await this.getUserProfile(updatedBy);
      if (updaterProfile.profile?.role !== 'super_admin') {
        return { success: false, error: 'Only super admins can update user roles' };
      }

      // For role updates, we need to use admin privileges
      // This operation requires special handling since we're updating another user's profile
      // In a real implementation, this would need to be done server-side with admin credentials
      
      return { success: false, error: 'Role updates require server-side admin operations' };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user role' 
      };
    }
  }
}