// Higher-order component for protecting admin routes
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import PageLoading from '@/components/ui/PageLoading';

interface AdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Component that protects admin routes and checks permissions
 */
export function AdminRoute({ 
  children, 
  requireSuperAdmin = false, 
  fallback 
}: AdminRouteProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isSuperAdmin, 
    canAccessAdmin,
    userRole 
  } = useRoleAccess();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Show loading while authentication state is being determined
  if (isAuthenticated === undefined) {
    return <PageLoading />;
  }

  // Don't render anything if not authenticated (redirect is in progress)
  if (!isAuthenticated) {
    return null;
  }

  // Check admin access
  if (!canAccessAdmin) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-2">
              You don't have permission to access this admin area.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Current role: {userRole || 'Unknown'}
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home
            </a>
          </div>
        </div>
      )
    );
  }

  // Check super admin requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Super Admin Required</h2>
            <p className="text-gray-600 mb-2">
              This area requires super administrator privileges.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Current role: {userRole || 'Unknown'}
            </p>
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Admin Dashboard
            </a>
          </div>
        </div>
      )
    );
  }

  // User has required permissions, render children
  return <>{children}</>;
}

/**
 * Component for protecting specific admin features with permission checks
 */
interface PermissionGateProps {
  children: React.ReactNode;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  children, 
  resource, 
  action, 
  fallback 
}: PermissionGateProps) {
  const { hasPermission } = useRoleAccess();

  if (!hasPermission(resource, action)) {
    return (
      fallback || (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have permission to {action} {resource}.
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}