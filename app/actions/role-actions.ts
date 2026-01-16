'use server';

import { getCurrentUserServer } from '@/lib/services/auth-service';
import { 
  hasPermission, 
  isAdmin as checkIsAdmin, 
  isSuperAdmin as checkIsSuperAdmin, 
  isCustomer as checkIsCustomer, 
  canAccessAdmin as checkCanAccessAdmin, 
  canManageAdmins as checkCanManageAdmins,
  type UserRole 
} from '@/lib/auth/roles';

export interface RoleAccessResult {
  userRole: UserRole | null;
  userId: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCustomer: boolean;
  canAccessAdmin: boolean;
  canManageAdmins: boolean;
}

/**
 * Server-side role access check
 */
export async function getRoleAccess(): Promise<RoleAccessResult> {
  try {
    const user = await getCurrentUserServer();
    
    if (!user) {
      return {
        userRole: null,
        userId: null,
        isAuthenticated: false,
        isAdmin: false,
        isSuperAdmin: false,
        isCustomer: false,
        canAccessAdmin: false,
        canManageAdmins: false,
      };
    }

    const userRole = user.role as UserRole;

    return {
      userRole,
      userId: user.userId,
      isAuthenticated: true,
      isAdmin: checkIsAdmin(userRole),
      isSuperAdmin: checkIsSuperAdmin(userRole),
      isCustomer: checkIsCustomer(userRole),
      canAccessAdmin: checkCanAccessAdmin(user),
      canManageAdmins: checkCanManageAdmins(user),
    };
  } catch (error) {
    console.error('Error getting role access:', error);
    return {
      userRole: null,
      userId: null,
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
      isCustomer: false,
      canAccessAdmin: false,
      canManageAdmins: false,
    };
  }
}

/**
 * Check specific permission on server
 */
export async function checkPermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
  try {
    const user = await getCurrentUserServer();
    if (!user) return false;
    
    return hasPermission(user.role as UserRole, resource, action);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Require admin access (throws error if not admin)
 */
export async function requireAdmin(): Promise<void> {
  const access = await getRoleAccess();
  
  if (!access.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  if (!access.isAdmin) {
    throw new Error('Admin access required');
  }
}

/**
 * Require super admin access (throws error if not super admin)
 */
export async function requireSuperAdmin(): Promise<void> {
  const access = await getRoleAccess();
  
  if (!access.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  if (!access.isSuperAdmin) {
    throw new Error('Super admin access required');
  }
}
