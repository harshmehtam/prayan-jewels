// Server-side admin authentication utilities
import { NextRequest } from 'next/server';
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
 * Note: This is a simplified version that relies on client-side authentication
 * In production, you should implement proper server-side token validation
 */
export async function authenticateAdmin(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // For now, we'll return a basic response that allows admin access
    // In production, you should validate the JWT token from the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        isSuperAdmin: false,
        error: 'No authorization token provided',
      };
    }

    // TODO: Implement proper JWT token validation here
    // For now, we'll assume the user is authenticated and has admin access
    return {
      isAuthenticated: true,
      isAdmin: true,
      isSuperAdmin: true,
      user: { userId: 'admin-user' },
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