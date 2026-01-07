// Role-based access control utilities for admin authentication

export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  customer: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'orders', action: 'read' },
    { resource: 'orders', action: 'create' },
    { resource: 'cart', action: 'create' },
    { resource: 'cart', action: 'read' },
    { resource: 'cart', action: 'update' },
    { resource: 'cart', action: 'delete' },
    { resource: 'products', action: 'read' },
    { resource: 'addresses', action: 'create' },
    { resource: 'addresses', action: 'read' },
    { resource: 'addresses', action: 'update' },
    { resource: 'addresses', action: 'delete' },
  ],
  admin: [
    // Customer permissions
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'orders', action: 'read' },
    { resource: 'orders', action: 'create' },
    { resource: 'cart', action: 'create' },
    { resource: 'cart', action: 'read' },
    { resource: 'cart', action: 'update' },
    { resource: 'cart', action: 'delete' },
    { resource: 'products', action: 'read' },
    { resource: 'addresses', action: 'create' },
    { resource: 'addresses', action: 'read' },
    { resource: 'addresses', action: 'update' },
    { resource: 'addresses', action: 'delete' },
    // Admin permissions
    { resource: 'admin/products', action: 'create' },
    { resource: 'admin/products', action: 'read' },
    { resource: 'admin/products', action: 'update' },
    { resource: 'admin/products', action: 'delete' },
    { resource: 'admin/orders', action: 'read' },
    { resource: 'admin/orders', action: 'update' },
    { resource: 'admin/inventory', action: 'read' },
    { resource: 'admin/inventory', action: 'update' },
    { resource: 'admin/customers', action: 'read' },
    { resource: 'admin/customers', action: 'update' },
    { resource: 'admin/analytics', action: 'read' },
  ],
  super_admin: [
    // All admin permissions
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'orders', action: 'read' },
    { resource: 'orders', action: 'create' },
    { resource: 'cart', action: 'create' },
    { resource: 'cart', action: 'read' },
    { resource: 'cart', action: 'update' },
    { resource: 'cart', action: 'delete' },
    { resource: 'products', action: 'read' },
    { resource: 'addresses', action: 'create' },
    { resource: 'addresses', action: 'read' },
    { resource: 'addresses', action: 'update' },
    { resource: 'addresses', action: 'delete' },
    { resource: 'admin/products', action: 'create' },
    { resource: 'admin/products', action: 'read' },
    { resource: 'admin/products', action: 'update' },
    { resource: 'admin/products', action: 'delete' },
    { resource: 'admin/orders', action: 'read' },
    { resource: 'admin/orders', action: 'update' },
    { resource: 'admin/inventory', action: 'read' },
    { resource: 'admin/inventory', action: 'update' },
    { resource: 'admin/customers', action: 'read' },
    { resource: 'admin/customers', action: 'update' },
    { resource: 'admin/analytics', action: 'read' },
    // Super admin exclusive permissions
    { resource: 'admin/users', action: 'create' },
    { resource: 'admin/users', action: 'read' },
    { resource: 'admin/users', action: 'update' },
    { resource: 'admin/users', action: 'delete' },
    { resource: 'admin/roles', action: 'create' },
    { resource: 'admin/roles', action: 'read' },
    { resource: 'admin/roles', action: 'update' },
    { resource: 'admin/roles', action: 'delete' },
    { resource: 'admin/audit', action: 'read' },
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: UserRole | null | undefined,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(p => p.resource === resource && p.action === action);
}

/**
 * Check if a user is an admin (admin or super_admin)
 */
export function isAdmin(userRole: UserRole | null | undefined): boolean {
  return userRole === 'admin' || userRole === 'super_admin';
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(userRole: UserRole | null | undefined): boolean {
  return userRole === 'super_admin';
}

/**
 * Check if a user is a customer
 */
export function isCustomer(userRole: UserRole | null | undefined): boolean {
  return userRole === 'customer';
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user can access admin features
 */
export function canAccessAdmin(userProfile: any): boolean {
  return isAdmin(userProfile?.role);
}

/**
 * Check if a user can manage other admin users
 */
export function canManageAdmins(userProfile: any): boolean {
  return isSuperAdmin(userProfile?.role);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole | null | undefined): string {
  switch (role) {
    case 'customer':
      return 'Customer';
    case 'admin':
      return 'Administrator';
    case 'super_admin':
      return 'Super Administrator';
    default:
      return 'Unknown';
  }
}

/**
 * Get available roles for assignment (based on current user's role)
 */
export function getAssignableRoles(currentUserRole: UserRole | null | undefined): UserRole[] {
  if (isSuperAdmin(currentUserRole)) {
    return ['customer', 'admin', 'super_admin'];
  } else if (isAdmin(currentUserRole)) {
    return ['customer'];
  }
  return [];
}

/**
 * Validate role transition (check if current user can assign a role to another user)
 */
export function canAssignRole(
  currentUserRole: UserRole | null | undefined,
  targetRole: UserRole
): boolean {
  const assignableRoles = getAssignableRoles(currentUserRole);
  return assignableRoles.includes(targetRole);
}