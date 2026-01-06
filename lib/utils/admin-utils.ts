// Admin utilities for role management and testing
import { UserService } from '@/lib/data/users';

/**
 * Utility to assign admin role to a user (for testing purposes)
 * This should be used carefully and only by authorized personnel
 */
export class AdminUtils {
  /**
   * Assign admin role to a user by phone number
   * @param phoneNumber - The phone number of the user (in +91XXXXXXXXXX format)
   * @param role - The role to assign ('admin' or 'super_admin')
   */
  static async assignAdminRole(phoneNumber: string, role: 'admin' | 'super_admin' | 'customer' = 'admin') {
    try {
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber.replace(/\D/g, '')}`;
      
      // Get user profile
      const userResponse = await UserService.getUserProfile(formattedPhone);
      
      if (!userResponse.profile) {
        throw new Error('User profile not found');
      }
      
      // Update user role
      const updateResponse = await UserService.updateUserProfile(formattedPhone, {
        role: role
      });
      
      if (updateResponse.profile) {
        console.log(`Successfully assigned ${role} role to ${formattedPhone}`);
        return { success: true, message: `User assigned ${role} role successfully` };
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error assigning admin role:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
  
  /**
   * Remove admin role from a user (set back to customer)
   * @param phoneNumber - The phone number of the user
   */
  static async removeAdminRole(phoneNumber: string) {
    return this.assignAdminRole(phoneNumber, 'customer');
  }
  
  /**
   * Check if a user has admin privileges
   * @param phoneNumber - The phone number of the user
   */
  static async checkAdminStatus(phoneNumber: string) {
    try {
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber 
        : `+91${phoneNumber.replace(/\D/g, '')}`;
      
      const userResponse = await UserService.getUserProfile(formattedPhone);
      
      if (!userResponse.profile) {
        return { success: false, error: 'User not found' };
      }
      
      const isAdmin = userResponse.profile.role === 'admin' || userResponse.profile.role === 'super_admin';
      
      return {
        success: true,
        isAdmin,
        role: userResponse.profile.role,
        user: {
          firstName: userResponse.profile.firstName,
          lastName: userResponse.profile.lastName,
          phone: userResponse.profile.phone
        }
      };
    } catch (error) {
      console.error('Error checking admin status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

/**
 * Console helper functions for testing (use in browser console)
 */
if (typeof window !== 'undefined') {
  (window as any).adminUtils = {
    makeAdmin: (phoneNumber: string) => AdminUtils.assignAdminRole(phoneNumber, 'admin'),
    makeSuperAdmin: (phoneNumber: string) => AdminUtils.assignAdminRole(phoneNumber, 'super_admin'),
    removeAdmin: (phoneNumber: string) => AdminUtils.removeAdminRole(phoneNumber),
    checkStatus: (phoneNumber: string) => AdminUtils.checkAdminStatus(phoneNumber),
  };
  
  console.log('Admin utilities loaded. Use adminUtils.makeAdmin("1234567890") to assign admin role.');
}