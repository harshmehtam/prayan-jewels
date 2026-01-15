import { signUp, confirmSignUp, signIn, resetPassword, confirmResetPassword, resendSignUpCode } from 'aws-amplify/auth';
import { getCurrentUser, fetchUserAttributes, fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth';
import { runWithAmplifyServerContext } from '@/utils/amplify-utils';
import { cookies } from 'next/headers';

// Types
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface SignUpParams {
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInParams {
  phoneNumber: string;
  password: string;
}

export interface ConfirmSignUpParams {
  phoneNumber: string;
  code: string;
}

export interface ResetPasswordParams {
  phoneNumber: string;
}

export interface ConfirmResetPasswordParams {
  phoneNumber: string;
  code: string;
  newPassword: string;
}

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

// Phone number utilities
export const formatPhoneForCognito = (phoneNumber: string): string => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return `+91${cleanPhone}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return `+${cleanPhone}`;
  } else if (phoneNumber.startsWith('+91') && cleanPhone.length === 12) {
    return phoneNumber;
  }
  
  return `+91${cleanPhone}`;
};

export const formatPhoneForDisplay = (phoneNumber: string): string => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    const number = cleanPhone.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  return phoneNumber;
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return /^[6-9]\d{9}$/.test(cleanPhone);
  }
  
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    const number = cleanPhone.slice(2);
    return /^[6-9]\d{9}$/.test(number);
  }
  
  if (phoneNumber.startsWith('+91') && cleanPhone.length === 12) {
    const number = cleanPhone.slice(2);
    return /^[6-9]\d{9}$/.test(number);
  }
  
  return false;
};

export const formatPhoneInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim();
  }
  return cleaned.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2');
};

// Error handling
export const getAuthErrorMessage = (error: any): string => {
  switch (error.name) {
    case 'NotAuthorizedException':
      return 'Invalid phone number or password.';
    case 'UserNotFoundException':
      return 'No account found with this phone number. Please sign up first.';
    case 'UsernameExistsException':
      return 'An account with this phone number already exists.';
    case 'CodeMismatchException':
      return 'Invalid OTP. Please try again.';
    case 'ExpiredCodeException':
      return 'OTP has expired. Please request a new one.';
    case 'LimitExceededException':
      return 'Too many attempts. Please try again later.';
    case 'InvalidPasswordException':
      return 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character.';
    case 'InvalidParameterException':
      return 'Invalid request. Please check your input and try again.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

// Auth operations using Amplify Gen 2
export const handleSignUp = async (params: SignUpParams): Promise<AuthResponse> => {
  try {
    const formattedPhone = formatPhoneForCognito(params.phoneNumber);
    
    const result = await signUp({
      username: formattedPhone,
      password: params.password,
      options: {
        userAttributes: {
          phone_number: formattedPhone,
          given_name: params.firstName.trim(),
          family_name: params.lastName.trim(),
        },
      },
    });
    
    return {
      success: true,
      message: 'OTP sent to your phone',
      data: { username: formattedPhone },
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
};

export const handleConfirmSignUp = async (params: ConfirmSignUpParams): Promise<AuthResponse> => {
  try {
    const formattedPhone = formatPhoneForCognito(params.phoneNumber);
    
    await confirmSignUp({
      username: formattedPhone,
      confirmationCode: params.code,
    });
    
    return {
      success: true,
      message: 'Account verified successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
};

export const handleSignIn = async (params: SignInParams): Promise<AuthResponse> => {
  try {
    const formattedPhone = formatPhoneForCognito(params.phoneNumber);
    
    const result = await signIn({
      username: formattedPhone,
      password: params.password,
    });
    
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
};

export const handleResetPassword = async (params: ResetPasswordParams): Promise<AuthResponse> => {
  try {
    const formattedPhone = formatPhoneForCognito(params.phoneNumber);
    
    await resetPassword({
      username: formattedPhone,
    });
    
    return {
      success: true,
      message: 'Reset code sent to your phone',
      data: { username: formattedPhone },
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
};

export const handleConfirmResetPassword = async (params: ConfirmResetPasswordParams): Promise<AuthResponse> => {
  try {
    const formattedPhone = formatPhoneForCognito(params.phoneNumber);
    
    await confirmResetPassword({
      username: formattedPhone,
      confirmationCode: params.code,
      newPassword: params.newPassword,
    });
    
    return {
      success: true,
      message: 'Password reset successful',
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
};

export const handleResendCode = async (phoneNumber: string): Promise<AuthResponse> => {
  try {
    const formattedPhone = formatPhoneForCognito(phoneNumber);
    
    await resendSignUpCode({
      username: formattedPhone,
    });
    
    return {
      success: true,
      message: 'OTP resent successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
};

/**
 * Get current authenticated user from server
 */
export async function getCurrentUserServer(): Promise<AuthUserProfile | null> {
  try {
    const user = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: () => getCurrentUser(),
    });

    if (!user?.userId) {
      return null;
    }

    // Get user attributes
    const attributes = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: () => fetchUserAttributes(),
    });

    // Get user groups from session
    let groups: string[] = [];
    let role: 'customer' | 'admin' | 'super_admin' = 'customer';

    try {
      const session = await runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: () => fetchAuthSession(),
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
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUserServer();
    return !!user;
  } catch (error) {
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
    return false;
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  try {
    await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: () => amplifySignOut(),
    });
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
