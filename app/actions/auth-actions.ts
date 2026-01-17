'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as authServiceServer from '@/lib/services/auth-service.server';
import type { AuthUserProfile } from '@/lib/services/auth-service.server';

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<AuthUserProfile | null> {
  try {
    return await authServiceServer.getCurrentUserServer();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    return await authServiceServer.isAuthenticated();
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Check if user has admin role
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    return await authServiceServer.isAdmin();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Check if user has super admin role
 */
export async function checkIsSuperAdmin(): Promise<boolean> {
  try {
    return await authServiceServer.isSuperAdmin();
  } catch (error) {
    console.error('Error checking super admin role:', error);
    return false;
  }
}

/**
 * Sign out user - Server action
 */
export async function signOutAction(): Promise<void> {
  try {
    // Clear all auth-related cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Delete all Amplify-related cookies
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('CognitoIdentityServiceProvider') || 
          cookie.name.includes('accessToken') || 
          cookie.name.includes('idToken') ||
          cookie.name.includes('refreshToken')) {
        cookieStore.delete(cookie.name);
      }
    });
    
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  
  redirect('/');
}
