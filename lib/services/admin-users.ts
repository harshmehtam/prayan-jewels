// Admin user management service - Simplified version
// Note: Since we don't store user profiles in our database models,
// this service provides stub implementations for user management features

import { UserRole } from '@/lib/auth/roles';

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
   * Note: Returns empty data since we don't store user profiles in database
   */
  static async getAllAdminUsers(
    _filters?: AdminUserSearchFilters
  ): Promise<{ users: AdminUserListItem[]; totalCount: number }> {
    // Since we don't have user profiles in our database models,
    // return empty data for now
    return {
      users: [],
      totalCount: 0,
    };
  }

  /**
   * Get a specific admin user by ID
   * Note: Returns null since we don't store user profiles in database
   */
  static async getAdminUser(_userId: string): Promise<AdminUserListItem | null> {
    // Since we don't have user profiles in our database models,
    // return null for now
    return null;
  }

  /**
   * Update admin user role and details
   * Note: Returns error since we don't store user profiles in database
   */
  static async updateAdminUser(
    _input: UpdateAdminUserInput,
    _currentUserRole?: UserRole | null | undefined,
    _adminContext?: any
  ): Promise<{ success: boolean; user?: AdminUserListItem; error?: string }> {
    // Since we don't have user profiles in our database models,
    // return error for now
    return { 
      success: false, 
      error: 'User management is not available - user profiles are not stored in database' 
    };
  }

  /**
   * Get user statistics for admin dashboard
   * Note: Returns zero stats since we don't store user profiles in database
   */
  static async getUserStatistics(): Promise<{
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    totalSuperAdmins: number;
    recentUsers: number;
  }> {
    // Since we don't have user profiles in our database models,
    // return zero stats
    return {
      totalUsers: 0,
      totalCustomers: 0,
      totalAdmins: 0,
      totalSuperAdmins: 0,
      recentUsers: 0,
    };
  }

  /**
   * Search users by email or name (for customer support)
   * Note: Returns empty array since we don't store user profiles in database
   */
  static async searchUsers(
    _query: string,
    _role?: UserRole
  ): Promise<AdminUserListItem[]> {
    // Since we don't have user profiles in our database models,
    // return empty array
    return [];
  }

  /**
   * Get audit log for user management actions
   * Note: Returns empty array since we don't have audit logging for now
   */
  static async getAuditLog(_userId?: string): Promise<any[]> {
    // Since we don't have audit logging enabled,
    // return empty array
    return [];
  }
}