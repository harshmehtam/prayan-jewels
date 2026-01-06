// Admin setup utilities for initial admin user creation
import { client } from '@/lib/amplify-client';
import { UserService } from '@/lib/data/users';
import { UserRole } from './roles';

export interface CreateAdminUserInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_admin';
}

/**
 * Create an admin user profile (for initial setup or super admin actions)
 */
export async function createAdminUser(input: CreateAdminUserInput): Promise<{
  success: boolean;
  error?: string;
  profile?: any;
}> {
  try {
    // Check if user profile already exists
    const existingProfile = await UserService.getUserProfile(input.userId);
    
    if (existingProfile.profile) {
      // Update existing profile to admin role
      const response = await client.models.UserProfile.update({
        id: existingProfile.profile.id,
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
      });
      
      return {
        success: true,
        profile: response.data,
      };
    } else {
      // Create new admin profile
      const response = await client.models.UserProfile.create({
        userId: input.userId, // Set userId as owner field
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        newsletter: false,
        smsUpdates: false,
        preferredCategories: [],
      });
      
      return {
        success: true,
        profile: response.data,
      };
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create admin user',
    };
  }
}

/**
 * Check if any super admin exists in the system
 */
export async function hasSuperAdmin(): Promise<boolean> {
  try {
    const response = await client.models.UserProfile.list({
      filter: { role: { eq: 'super_admin' } },
      limit: 1,
    });
    
    return (response.data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking for super admin:', error);
    return false;
  }
}

/**
 * Promote a user to admin role (super admin only)
 */
export async function promoteToAdmin(
  userId: string,
  role: 'admin' | 'super_admin',
  currentUserRole: UserRole | null | undefined
): Promise<{ success: boolean; error?: string }> {
  try {
    // Only super admins can promote users
    if (currentUserRole !== 'super_admin') {
      return {
        success: false,
        error: 'Only super administrators can promote users to admin roles',
      };
    }
    
    // Get existing profile
    const existingProfile = await UserService.getUserProfile(userId);
    
    if (!existingProfile.profile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }
    
    // Update role - this requires admin privileges
    await client.models.UserProfile.update({
      id: existingProfile.profile.id,
      role,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to promote user',
    };
  }
}

/**
 * Get all admin users for management
 */
export async function getAllAdminUsers(): Promise<{
  admins: any[];
  superAdmins: any[];
}> {
  try {
    const response = await client.models.UserProfile.list({
      filter: {
        or: [
          { role: { eq: 'admin' } },
          { role: { eq: 'super_admin' } }
        ]
      },
      limit: 100,
    });
    
    const profiles = response.data || [];
    
    return {
      admins: profiles.filter(p => p.role === 'admin'),
      superAdmins: profiles.filter(p => p.role === 'super_admin'),
    };
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return {
      admins: [],
      superAdmins: [],
    };
  }
}