// Server-side admin authentication utilities
import { NextRequest } from 'next/server';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { UserService } from '@/lib/data/users';
import { UserRole, isAdmin, isSuperAdmin } from './roles';

export interface AdminAuthResult {
  isAuthenticated: boolean;
  user?: any;
  userProfile?: any;
  userRole?: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  error?: string;
}

/**
 * Authenticate and authorize admin users on the server side
 */
export async function authenticateAdmin(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Get current user from Amplify
    const user = await getCurrentUser();
    
    if (!user?.userId) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        isSuperAdmin: false,
        error: 'Not authenticated',
      };
    }

    // Get user profile to check role
    const profileResponse = await UserService.getUserProfile(user.userId);
    
    if (!profileResponse.profile) {
      return {
        isAuthenticated: true,
        user,
        isAdmin: false,
        isSuperAdmin: false,
        error: 'User profile not found',
      };
    }

    const userRole = profileResponse.profile.role as UserRole;
    const userIsAdmin = isAdmin(userRole);
    const userIsSuperAdmin = isSuperAdmin(userRole);

    return {
      isAuthenticated: true,
      user,
      userProfile: profileResponse.profile,
      userRole,
      isAdmin: userIsAdmin,
      isSuperAdmin: userIsSuperAdmin,
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Require admin authentication for API routes
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const auth = await authenticateAdmin(request);
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  if (!auth.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return auth;
}

/**
 * Require super admin authentication for API routes
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const auth = await authenticateAdmin(request);
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  if (!auth.isSuperAdmin) {
    throw new Error('Super admin access required');
  }
  
  return auth;
}

/**
 * Create admin context for audit logging
 */
export function createAdminContext(auth: AdminAuthResult, request: NextRequest) {
  return {
    adminId: auth.user?.userId || 'unknown',
    adminEmail: auth.user?.signInDetails?.loginId || 'unknown',
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    sessionId: request.headers.get('x-session-id') || 'unknown',
  };
}