// Admin user management service
import { client } from '@/lib/amplify-client';
import { UserProfile } from '@/types';
import { UserRole, canAssignRole } from '@/lib/auth/roles';
import { AdminAuditService, AdminContext } from './admin-audit';

export interface AdminUserListItem {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  role: UserRole | null;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface CreateAdminUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  temporaryPassword?: string;
}

export interface UpdateAdminUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface AdminUserSearchFilters {
  role?: UserRole;
  isActive?: boolean;
  searchQuery?: string;
}

export class AdminUserService {
  /**
   * Get all admin users (super admin only)
   */
  static async getAllAdminUsers(
    filters?: AdminUserSearchFilters
  ): Promise<{ users: AdminUserListItem[]; totalCount: number }> {
    try {
      // Build filter conditions
      const filterConditions: any = {};
      
      if (filters?.role) {
        filterConditions.role = { eq: filters.role };
      }
      
      // For admin users, we want admin and super_admin roles
      if (!filters?.role) {
        filterConditions.or = [
          { role: { eq: 'admin' } },
          { role: { eq: 'super_admin' } }
        ];
      }

      const response = await client.models.UserProfile.list({
        filter: filterConditions,
        limit: 100, // Adjust as needed
      });

      if (!response.data) {
        return { users: [], totalCount: 0 };
      }

      // Transform the data
      const users: AdminUserListItem[] = response.data.map(profile => ({
        id: profile.id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: undefined, // We'll need to get this from Cognito if needed
        role: profile.role as UserRole,
        createdAt: profile.createdAt,
        lastLogin: undefined, // We'll need to track this separately
        isActive: true, // We'll need to implement this field
      }));

      // Apply search filter if provided
      let filteredUsers = users;
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredUsers = users.filter(user => 
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      }

      return {
        users: filteredUsers,
        totalCount: filteredUsers.length,
      };
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw new Error('Failed to fetch admin users');
    }
  }

  /**
   * Get a specific admin user by ID
   */
  static async getAdminUser(userId: string): Promise<AdminUserListItem | null> {
    try {
      const response = await client.models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const profile = response.data[0];
      
      return {
        id: profile.id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: undefined, // We'll need to get this from Cognito if needed
        role: profile.role as UserRole,
        createdAt: profile.createdAt,
        lastLogin: undefined, // We'll need to track this separately
        isActive: true, // We'll need to implement this field
      };
    } catch (error) {
      console.error('Error fetching admin user:', error);
      throw new Error('Failed to fetch admin user');
    }
  }

  /**
   * Update admin user role and details
   */
  static async updateAdminUser(
    input: UpdateAdminUserInput,
    currentUserRole: UserRole | null | undefined,
    adminContext?: AdminContext
  ): Promise<{ success: boolean; user?: AdminUserListItem; error?: string }> {
    try {
      // First, get the current user profile
      const existingResponse = await client.models.UserProfile.list({
        filter: { userId: { eq: input.userId } },
      });

      if (!existingResponse.data || existingResponse.data.length === 0) {
        // Log failed attempt
        if (adminContext) {
          await AdminAuditService.logUserAction(
            adminContext,
            'user_updated',
            input.userId,
            undefined,
            'Failed to update user - user not found',
            { updateData: input },
            false,
            'User not found'
          );
        }
        return { success: false, error: 'User not found' };
      }

      const existingProfile = existingResponse.data[0];

      // Check if current user can assign the new role
      if (input.role && !canAssignRole(currentUserRole, input.role)) {
        // Log permission denied
        if (adminContext) {
          await AdminAuditService.logPermissionDenied(
            adminContext,
            'user',
            input.userId,
            'Insufficient permissions to assign role',
            { attemptedRole: input.role, currentUserRole }
          );
        }
        return { 
          success: false, 
          error: 'You do not have permission to assign this role' 
        };
      }

      // Update the profile
      const updateData: any = {};
      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.role !== undefined) updateData.role = input.role;

      const response = await client.models.UserProfile.update({
        id: existingProfile.id,
        ...updateData,
      });

      if (!response.data) {
        // Log failed update
        if (adminContext) {
          await AdminAuditService.logUserAction(
            adminContext,
            'user_updated',
            input.userId,
            undefined,
            'Failed to update user profile',
            { updateData },
            false,
            'Database update failed'
          );
        }
        return { success: false, error: 'Failed to update user' };
      }

      const updatedUser: AdminUserListItem = {
        id: response.data.id,
        userId: response.data.userId,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: undefined,
        role: response.data.role as UserRole,
        createdAt: response.data.createdAt,
        lastLogin: undefined,
        isActive: true,
      };

      // Log successful update
      if (adminContext) {
        const description = input.role && input.role !== existingProfile.role
          ? `User role changed from ${existingProfile.role} to ${input.role}`
          : 'User profile updated';
        
        const action = input.role && input.role !== existingProfile.role ? 'role_changed' : 'user_updated';
        
        await AdminAuditService.logUserAction(
          adminContext,
          action,
          input.userId,
          undefined,
          description,
          { 
            updateData,
            previousRole: existingProfile.role,
            newRole: input.role 
          },
          true
        );
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error updating admin user:', error);
      
      // Log error
      if (adminContext) {
        await AdminAuditService.logUserAction(
          adminContext,
          'user_updated',
          input.userId,
          undefined,
          'Error updating user profile',
          { updateData: input },
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user' 
      };
    }
  }

  /**
   * Get user statistics for admin dashboard
   */
  static async getUserStatistics(): Promise<{
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    totalSuperAdmins: number;
    recentUsers: number; // Users created in last 30 days
  }> {
    try {
      const response = await client.models.UserProfile.list({
        limit: 1000, // Adjust as needed
      });

      if (!response.data) {
        return {
          totalUsers: 0,
          totalCustomers: 0,
          totalAdmins: 0,
          totalSuperAdmins: 0,
          recentUsers: 0,
        };
      }

      const users = response.data;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = {
        totalUsers: users.length,
        totalCustomers: users.filter(u => u.role === 'customer').length,
        totalAdmins: users.filter(u => u.role === 'admin').length,
        totalSuperAdmins: users.filter(u => u.role === 'super_admin').length,
        recentUsers: users.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  /**
   * Search users by email or name (for customer support)
   */
  static async searchUsers(
    query: string,
    role?: UserRole
  ): Promise<AdminUserListItem[]> {
    try {
      const filterConditions: any = {};
      
      if (role) {
        filterConditions.role = { eq: role };
      }

      const response = await client.models.UserProfile.list({
        filter: filterConditions,
        limit: 50,
      });

      if (!response.data) {
        return [];
      }

      // Filter by search query
      const searchQuery = query.toLowerCase();
      const filteredUsers = response.data.filter(user => 
        user.firstName?.toLowerCase().includes(searchQuery) ||
        user.lastName?.toLowerCase().includes(searchQuery)
      );

      return filteredUsers.map(profile => ({
        id: profile.id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: undefined,
        role: profile.role as UserRole,
        createdAt: profile.createdAt,
        lastLogin: undefined,
        isActive: true,
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get audit log for user management actions
   */
  static async getAuditLog(userId?: string): Promise<any[]> {
    try {
      const { AuditLoggingService } = await import('./audit-logging');
      
      if (userId) {
        return await AuditLoggingService.getUserActivityTimeline(userId);
      } else {
        const { logs } = await AuditLoggingService.getAuditLogs(
          { resource: 'user' },
          100
        );
        return logs;
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }
}