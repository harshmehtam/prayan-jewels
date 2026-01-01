// Hook for role-based access control
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { 
  hasPermission, 
  isAdmin, 
  isSuperAdmin, 
  isCustomer, 
  canAccessAdmin, 
  canManageAdmins,
  UserRole 
} from '@/lib/auth/roles';

export interface RoleAccessHook {
  userRole: UserRole | null | undefined;
  userProfile: any;
  userId: string | null | undefined;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCustomer: boolean;
  canAccessAdmin: boolean;
  canManageAdmins: boolean;
  hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
  checkPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
}

/**
 * Hook to check user roles and permissions
 */
export function useRoleAccess(): RoleAccessHook {
  const { user, userProfile, isAuthenticated } = useAuth();
  
  const userRole = userProfile?.role;
  
  return {
    userRole,
    userProfile,
    userId: user?.userId,
    isAuthenticated,
    isAdmin: isAdmin(userRole),
    isSuperAdmin: isSuperAdmin(userRole),
    isCustomer: isCustomer(userRole),
    canAccessAdmin: canAccessAdmin(userProfile),
    canManageAdmins: canManageAdmins(userProfile),
    hasPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => 
      hasPermission(userRole, resource, action),
    checkPermission: (resource: string, action: 'create' | 'read' | 'update' | 'delete') => 
      hasPermission(userRole, resource, action),
  };
}

/**
 * Hook specifically for admin access checks
 */
export function useAdminAccess() {
  const roleAccess = useRoleAccess();
  
  return {
    ...roleAccess,
    requireAdmin: () => {
      if (!roleAccess.isAuthenticated) {
        throw new Error('Authentication required');
      }
      if (!roleAccess.isAdmin) {
        throw new Error('Admin access required');
      }
    },
    requireSuperAdmin: () => {
      if (!roleAccess.isAuthenticated) {
        throw new Error('Authentication required');
      }
      if (!roleAccess.isSuperAdmin) {
        throw new Error('Super admin access required');
      }
    },
  };
}