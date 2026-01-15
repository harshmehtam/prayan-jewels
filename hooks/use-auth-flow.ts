import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as authActions from '@/app/actions/auth-actions';
import type {
  SignUpParams,
  SignInParams,
  ConfirmSignUpParams,
  ResetPasswordParams,
  ConfirmResetPasswordParams,
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
  confirmSignUp: (params: ConfirmSignUpParams & { password: string }) => Promise<boolean>;
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
  
  const router = useRouter();

  const clearError = useCallback(() => setError(''), []);

  const handleSuccess = useCallback(async () => {
    onClose?.();
    router.push(isAdminLogin ? '/admin' : redirectTo);
    router.refresh(); // Refresh to get new auth state
  }, [onClose, router, isAdminLogin, redirectTo]);

  const signUp = useCallback(async (params: SignUpParams) => {
    setIsLoading(true);
    setError('');

    const result = await authActions.signUp(params);
    
    setIsLoading(false);
    
    if (result.success) {
      return { success: true, username: result.data?.username };
    } else {
      setError(result.error || 'Sign up failed');
      return { success: false };
    }
  }, []);

  const confirmSignUp = useCallback(async (params: ConfirmSignUpParams & { password: string }) => {
    setIsLoading(true);
    setError('');

    const confirmResult = await authActions.confirmSignUp({
      phoneNumber: params.phoneNumber,
      code: params.code,
    });
    
    if (!confirmResult.success) {
      setIsLoading(false);
      setError(confirmResult.error || 'Verification failed');
      return false;
    }

    // Auto sign in after confirmation
    const signInResult = await authActions.signIn({
      phoneNumber: params.phoneNumber,
      password: params.password,
    });

    setIsLoading(false);

    if (signInResult.success) {
      await handleSuccess();
      return true;
    } else {
      setError('Account verified! Please log in manually.');
      setStep('login');
      return false;
    }
  }, [handleSuccess]);

  const signIn = useCallback(async (params: SignInParams) => {
    setIsLoading(true);
    setError('');

    const result = await authActions.signIn(params);
    
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

    const result = await authActions.resetPassword(params);
    
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

    const confirmResult = await authActions.confirmResetPassword(params);
    
    if (!confirmResult.success) {
      setIsLoading(false);
      setError(confirmResult.error || 'Password reset failed');
      return false;
    }

    // Auto sign in after password reset
    const signInResult = await authActions.signIn({
      phoneNumber: params.phoneNumber,
      password: params.newPassword,
    });

    setIsLoading(false);

    if (signInResult.success) {
      await handleSuccess();
      return true;
    } else {
      setError('Password reset successful! Please log in.');
      setStep('login');
      return false;
    }
  }, [handleSuccess]);

  const resendCode = useCallback(async (phoneNumber: string) => {
    setIsLoading(true);
    setError('');

    const result = await authActions.resendCode(phoneNumber);
    
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
