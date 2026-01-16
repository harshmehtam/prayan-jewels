'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as authService from '@/lib/services/auth-service';
import type { 
  AuthResponse, 
  SignUpParams, 
  SignInParams, 
  ConfirmSignUpParams, 
  ResetPasswordParams, 
  ConfirmResetPasswordParams,
  AuthUserProfile 
} from '@/lib/services/auth-service';

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<AuthUserProfile | null> {
  try {
    return await authService.getCurrentUserServer();
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
    return await authService.isAuthenticated();
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
    return await authService.isAdmin();
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
    return await authService.isSuperAdmin();
  } catch (error) {
    console.error('Error checking super admin role:', error);
    return false;
  }
}

/**
 * Sign up a new user
 */
export async function signUp(params: SignUpParams): Promise<AuthResponse> {
  try {
    const result = await authService.handleSignUp(params);
    return result;
  } catch (error) {
    console.error('Error signing up:', error);
    return {
      success: false,
      error: 'Failed to sign up. Please try again.',
    };
  }
}

/**
 * Confirm sign up with OTP
 */
export async function confirmSignUp(params: ConfirmSignUpParams): Promise<AuthResponse> {
  try {
    const result = await authService.handleConfirmSignUp(params);
    
    if (result.success) {
      revalidatePath('/');
    }
    
    return result;
  } catch (error) {
    console.error('Error confirming sign up:', error);
    return {
      success: false,
      error: 'Failed to confirm sign up. Please try again.',
    };
  }
}

/**
 * Sign in user
 */
export async function signIn(params: SignInParams): Promise<AuthResponse> {
  try {
    const result = await authService.handleSignIn(params);
    
    if (result.success) {
      revalidatePath('/');
    }
    
    return result;
  } catch (error) {
    console.error('Error signing in:', error);
    return {
      success: false,
      error: 'Failed to sign in. Please try again.',
    };
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  try {
    await authService.signOut();
    revalidatePath('/');
    redirect('/');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Reset password
 */
export async function resetPassword(params: ResetPasswordParams): Promise<AuthResponse> {
  try {
    return await authService.handleResetPassword(params);
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      error: 'Failed to reset password. Please try again.',
    };
  }
}

/**
 * Confirm reset password with OTP
 */
export async function confirmResetPassword(params: ConfirmResetPasswordParams): Promise<AuthResponse> {
  try {
    return await authService.handleConfirmResetPassword(params);
  } catch (error) {
    console.error('Error confirming reset password:', error);
    return {
      success: false,
      error: 'Failed to reset password. Please try again.',
    };
  }
}

/**
 * Resend OTP code
 */
export async function resendCode(phoneNumber: string): Promise<AuthResponse> {
  try {
    return await authService.handleResendCode(phoneNumber);
  } catch (error) {
    console.error('Error resending code:', error);
    return {
      success: false,
      error: 'Failed to resend code. Please try again.',
    };
  }
}

/**
 * Validate phone number
 */
export async function validatePhoneNumber(phoneNumber: string): Promise<boolean> {
  return authService.validatePhoneNumber(phoneNumber);
}

/**
 * Format phone number for display
 */
export async function formatPhoneForDisplay(phoneNumber: string): Promise<string> {
  return authService.formatPhoneForDisplay(phoneNumber);
}

/**
 * Format phone number for Cognito
 */
export async function formatPhoneForCognito(phoneNumber: string): Promise<string> {
  return authService.formatPhoneForCognito(phoneNumber);
}
