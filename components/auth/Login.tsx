'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthFlow } from '@/hooks/use-auth-flow';
import { useCountdown } from '@/hooks/use-countdown';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import {
  LoginForm,
  SignUpForm,
  OTPForm,
  ForgotPasswordForm,
  NewPasswordForm,
} from './forms';

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  isAdminLogin?: boolean;
}

export default function Login({ 
  isOpen, 
  onClose, 
  redirectTo = '/account',
  isAdminLogin = false 
}: LoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [resetUsername, setResetUsername] = useState('');
  
  // Custom hooks
  const authFlow = useAuthFlow({ redirectTo, isAdminLogin, onClose });
  const { countdown, startCountdown, resetCountdown } = useCountdown();
  useBodyScrollLock({ isLocked: isOpen });

  // Reset form when modal opens/closes
  const resetForm = () => {
    authFlow.setStep('login');
    setPhoneNumber('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setOtp('');
    authFlow.clearError();
    resetCountdown();
    setSignUpUsername('');
    setResetUsername('');
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Form handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFlow.signIn({ phoneNumber, password });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authFlow.signUp({ 
      phoneNumber, 
      password, 
      firstName, 
      lastName 
    });
    
    if (result.success && result.username) {
      setSignUpUsername(result.username);
      setSignUpPassword(password); // Store password for auto sign-in after verification
      authFlow.setStep('otp');
      startCountdown(60);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFlow.confirmSignUp({ 
      phoneNumber: signUpUsername, 
      code: otp,
      password: signUpPassword // Pass password for auto sign-in
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authFlow.resetPassword({ phoneNumber });
    
    if (result.success && result.username) {
      setResetUsername(result.username);
      authFlow.setStep('reset-otp');
      startCountdown(60);
    }
  };

  const handleVerifyResetOTP = (e: React.FormEvent) => {
    e.preventDefault();
    authFlow.setStep('new-password');
    authFlow.clearError();
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFlow.confirmPasswordReset({
      phoneNumber: resetUsername,
      code: otp,
      newPassword,
    });
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    const success = await authFlow.resendCode(
      authFlow.step === 'reset-otp' ? resetUsername : signUpUsername
    );
    
    if (success) {
      startCountdown(60);
    }
  };

  // Helper to get step title and description
  const getStepInfo = () => {
    switch (authFlow.step) {
      case 'login':
        return {
          title: isAdminLogin ? 'Admin Login' : 'Login',
          description: 'Enter your phone number and password',
        };
      case 'signup':
        return {
          title: 'Sign Up',
          description: 'Create your account with all required details',
        };
      case 'otp':
        return {
          title: 'Verify Phone',
          description: 'Enter the OTP sent to your phone number',
        };
      case 'forgot-password':
        return {
          title: 'Reset Password',
          description: 'Enter your phone number to reset password',
        };
      case 'reset-otp':
        return {
          title: 'Verify Reset Code',
          description: 'Enter the reset code sent to your phone',
        };
      case 'new-password':
        return {
          title: 'Set New Password',
          description: 'Create a new password for your account',
        };
      default:
        return { title: '', description: '' };
    }
  };

  if (!isOpen) return null;

  const stepInfo = getStepInfo();

  const modalContent = (
    <div className="fixed inset-0 z-[110] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Gradient backdrop */}
        <div className="fixed inset-0 transition-all duration-300 ease-out">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-yellow-100 to-pink-200"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-transparent to-pink-300/40"></div>
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        {/* Modal */}
        <div className="relative bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 border border-white/20 transform transition-all duration-300 scale-100 opacity-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {stepInfo.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {stepInfo.description}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Admin Login Indicator */}
          {isAdminLogin && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm text-blue-700 font-medium">Admin Access Required</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {authFlow.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{authFlow.error}</p>
            </div>
          )}

          {/* Render appropriate form based on step */}
          {authFlow.step === 'login' && (
            <LoginForm
              phoneNumber={phoneNumber}
              password={password}
              isLoading={authFlow.isLoading}
              onPhoneChange={setPhoneNumber}
              onPasswordChange={setPassword}
              onSubmit={handleLogin}
              onForgotPassword={() => {
                authFlow.setStep('forgot-password');
                authFlow.clearError();
                setPhoneNumber('');
              }}
              onSwitchToSignup={() => {
                authFlow.setStep('signup');
                authFlow.clearError();
                setPhoneNumber('');
                setPassword('');
                setFirstName('');
                setLastName('');
              }}
            />
          )}

          {authFlow.step === 'signup' && (
            <SignUpForm
              firstName={firstName}
              lastName={lastName}
              phoneNumber={phoneNumber}
              password={password}
              isLoading={authFlow.isLoading}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onPhoneChange={setPhoneNumber}
              onPasswordChange={setPassword}
              onSubmit={handleSignUp}
              onSwitchToLogin={() => {
                authFlow.setStep('login');
                authFlow.clearError();
                setPhoneNumber('');
                setPassword('');
                setFirstName('');
                setLastName('');
              }}
            />
          )}

          {authFlow.step === 'otp' && (
            <OTPForm
              otp={otp}
              phoneNumber={phoneNumber}
              isLoading={authFlow.isLoading}
              countdown={countdown}
              onOtpChange={setOtp}
              onSubmit={handleVerifyOTP}
              onResend={handleResendOTP}
              onBack={() => {
                authFlow.setStep('signup');
                authFlow.clearError();
                setOtp('');
              }}
              submitButtonText="VERIFY & CREATE ACCOUNT"
            />
          )}

          {authFlow.step === 'forgot-password' && (
            <ForgotPasswordForm
              phoneNumber={phoneNumber}
              isLoading={authFlow.isLoading}
              onPhoneChange={setPhoneNumber}
              onSubmit={handleForgotPassword}
              onBack={() => {
                authFlow.setStep('login');
                authFlow.clearError();
                setPhoneNumber('');
              }}
            />
          )}

          {authFlow.step === 'reset-otp' && (
            <OTPForm
              otp={otp}
              phoneNumber={phoneNumber}
              isLoading={authFlow.isLoading}
              countdown={countdown}
              onOtpChange={setOtp}
              onSubmit={handleVerifyResetOTP}
              onResend={handleResendOTP}
              onBack={() => {
                authFlow.setStep('forgot-password');
                authFlow.clearError();
                setOtp('');
              }}
              submitButtonText="VERIFY CODE"
            />
          )}

          {authFlow.step === 'new-password' && (
            <NewPasswordForm
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              isLoading={authFlow.isLoading}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={handleSetNewPassword}
              onBack={() => {
                authFlow.setStep('reset-otp');
                authFlow.clearError();
                setNewPassword('');
                setConfirmPassword('');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}