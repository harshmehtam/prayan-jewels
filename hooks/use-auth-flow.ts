import { useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import {
  handleSignUp,
  handleConfirmSignUp,
  handleSignIn,
  handleResetPassword,
  handleConfirmResetPassword,
  handleResendCode,
  formatPhoneForCognito,
  type SignUpParams,
  type SignInParams,
  type ConfirmSignUpParams,
  type ResetPasswordParams,
  type ConfirmResetPasswordParams,
} from '@/lib/services/auth-service';

type AuthStep = 'login' | 'signup' | 'otp' | 'forgot-password' | 'reset-otp' | 'new-password';

interface UseAuthFlowReturn {
  // State
  step: AuthStep;
  isLoading: boolean;
  error: string;
  
  // Actions
  setStep: (step: AuthStep) => void;
  setError: (error: string) => void;
  clearError: () => void;
  
  // Auth operations
  signUp: (params: SignUpParams) => Promise<{ success: boolean; username?: string }>;
  confirmSignUp: (params: ConfirmSignUpParams) => Promise<boolean>;
  signIn: (params: SignInParams) => Promise<boolean>;
  resetPassword: (params: ResetPasswordParams) => Promise<{ success: boolean; username?: string }>;
  confirmPasswordReset: (params: ConfirmResetPasswordParams) => Promise<boolean>;
  resendCode: (phoneNumber: string) => Promise<boolean>;
}

interface UseAuthFlowProps {
  redirectTo?: string;
  isAdminLogin?: boolean;
  onClose?: () => void;
}

export const useAuthFlow = ({ 
  redirectTo = '/account', 
  isAdminLogin = false,
  onClose 
}: UseAuthFlowProps = {}): UseAuthFlowReturn => {
  const [step, setStep] = useState<AuthStep>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { refreshAuthState } = useAuth();
  const router = useRouter();

  const clearError = useCallback(() => setError(''), []);

  const handleSuccess = useCallback(async () => {
    await refreshAuthState();
    onClose?.();
    router.push(isAdminLogin ? '/admin' : redirectTo);
  }, [refreshAuthState, onClose, router, isAdminLogin, redirectTo]);

  const signUp = useCallback(async (params: SignUpParams) => {
    setIsLoading(true);
    setError('');

    const result = await handleSignUp(params);
    
    setIsLoading(false);
    
    if (result.success) {
      return { success: true, username: result.data?.username };
    } else {
      setError(result.error || 'Sign up failed');
      return { success: false };
    }
  }, []);

  const confirmSignUp = useCallback(async (params: ConfirmSignUpParams) => {
    setIsLoading(true);
    setError('');

    const confirmResult = await handleConfirmSignUp(params);
    
    if (!confirmResult.success) {
      setIsLoading(false);
      setError(confirmResult.error || 'Verification failed');
      return false;
    }

    // Auto sign in after confirmation
    const signInResult = await handleSignIn({
      phoneNumber: params.phoneNumber,
      password: '', // Password should be passed from the signup form
    });

    setIsLoading(false);

    if (signInResult.success) {
      await handleSuccess();
      return true;
    } else {
      setError(signInResult.error || 'Auto sign-in failed. Please log in manually.');
      return false;
    }
  }, [handleSuccess]);

  const signIn = useCallback(async (params: SignInParams) => {
    setIsLoading(true);
    setError('');

    const result = await handleSignIn(params);
    
    setIsLoading(false);

    if (result.success) {
      await handleSuccess();
      return true;
    } else {
      setError(result.error || 'Sign in failed');
      return false;
    }
  }, [handleSuccess]);

  const resetPassword = useCallback(async (params: ResetPasswordParams) => {
    setIsLoading(true);
    setError('');

    const result = await handleResetPassword(params);
    
    setIsLoading(false);

    if (result.success) {
      return { success: true, username: result.data?.username };
    } else {
      setError(result.error || 'Password reset failed');
      return { success: false };
    }
  }, []);

  const confirmPasswordReset = useCallback(async (params: ConfirmResetPasswordParams) => {
    setIsLoading(true);
    setError('');

    const confirmResult = await handleConfirmResetPassword(params);
    
    if (!confirmResult.success) {
      setIsLoading(false);
      setError(confirmResult.error || 'Password reset failed');
      return false;
    }

    // Auto sign in after password reset
    const signInResult = await handleSignIn({
      phoneNumber: params.phoneNumber,
      password: params.newPassword,
    });

    setIsLoading(false);

    if (signInResult.success) {
      await handleSuccess();
      return true;
    } else {
      setError(signInResult.error || 'Auto sign-in failed. Please log in manually.');
      return false;
    }
  }, [handleSuccess]);

  const resendCode = useCallback(async (phoneNumber: string) => {
    setIsLoading(true);
    setError('');

    const result = await handleResendCode(phoneNumber);
    
    setIsLoading(false);

    if (result.success) {
      return true;
    } else {
      setError(result.error || 'Failed to resend code');
      return false;
    }
  }, []);

  return {
    step,
    isLoading,
    error,
    setStep,
    setError,
    clearError,
    signUp,
    confirmSignUp,
    signIn,
    resetPassword,
    confirmPasswordReset,
    resendCode,
  };
};
