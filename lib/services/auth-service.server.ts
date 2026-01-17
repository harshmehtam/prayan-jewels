import { getCurrentUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/utils/amplify-utils';

// Define user profile type based on Cognito attributes
export interface AuthUserProfile {
  userId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  groups?: string[];
  role?: 'customer' | 'admin' | 'super_admin';
}

/**
 * Get current authenticated user from server
 */
export async function getCurrentUserServer(): Promise<AuthUserProfile | null> {
  try {
    const { cookies } = await import('next/headers');
    
    const user = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });

    if (!user?.userId) {
      return null;
    }

    // Get user attributes
    const attributes = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchUserAttributes(contextSpec),
    });

    // Get user groups from session
    let groups: string[] = [];
    let role: 'customer' | 'admin' | 'super_admin' = 'customer';

    try {
      const session = await runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: (contextSpec) => fetchAuthSession(contextSpec),
      });

      const accessToken = session.tokens?.accessToken;
      if (accessToken) {
        groups = (accessToken.payload['cognito:groups'] as string[]) || [];

        // Determine role based on groups
        if (groups.includes('super_admin')) {
          role = 'super_admin';
        } else if (groups.includes('admin')) {
          role = 'admin';
        } else {
          role = 'customer';
        }
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }

    return {
      userId: user.userId,
      email: attributes.email,
      phone: attributes.phone_number,
      firstName: attributes.given_name,
      lastName: attributes.family_name,
      groups,
      role,
    };
  } catch (error: unknown) {
    const err = error as { name?: string };
    // Only log unexpected errors, not authentication failures for guest users
    if (err?.name !== 'UserUnAuthenticatedException') {
      console.error('Error getting current user:', error);
    }
    return null;
  }
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUserServer();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUserServer();
    return user?.role === 'admin' || user?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Check if user has super admin role
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUserServer();
    return user?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking super admin role:', error);
    return false;
  }
}
