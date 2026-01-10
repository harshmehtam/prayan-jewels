'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { CognitoServerAuthService } from '@/lib/services/cognito-server-auth';
import { signUp, confirmSignUp, signIn, resetPassword, confirmResetPassword } from 'aws-amplify/auth';

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  isAdminLogin?: boolean;
}

type Step = 'login' | 'signup' | 'otp' | 'forgot-password' | 'reset-otp' | 'new-password';

export default function PhoneLoginModal({ 
  isOpen, 
  onClose, 
  redirectTo = '/account',
  isAdminLogin = false 
}: PhoneLoginModalProps) {
  const [step, setStep] = useState<Step>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [signUpUsername, setSignUpUsername] = useState(''); // Store username for OTP verification
  const [resetUsername, setResetUsername] = useState(''); // Store username for password reset
  
  const { refreshAuthState, updateUserProfile } = useAuth();
  const router = useRouter();

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('login');
      setPhoneNumber('');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setOtp('');
      setError('');
      setCountdown(0);
      setSignUpUsername('');
      setResetUsername('');
      
      // Prevent body scroll when modal is open
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = CognitoServerAuthService.formatPhoneForCognito(phoneNumber);
      
      const signInResult = await signIn({
        username: formattedPhone,
        password: password,
      });

      // Refresh auth state to update the provider
      await refreshAuthState();
      
      // Close modal and redirect
      onClose();
      
      if (isAdminLogin) {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = CognitoServerAuthService.formatPhoneForCognito(phoneNumber);
      
      const signUpResult = await signUp({
        username: formattedPhone,
        password: password,
        options: {
          userAttributes: {
            phone_number: formattedPhone,
            given_name: firstName.trim(),
            family_name: lastName.trim(),
          },
        },
      });
      
      setSignUpUsername(formattedPhone);
      setStep('otp');
      setCountdown(60);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Confirm signup with OTP
      await confirmSignUp({
        username: signUpUsername,
        confirmationCode: otp,
      });

      // After confirmation, sign in the user
      await signIn({
        username: signUpUsername,
        password: password,
      });

      // Refresh auth state to update the provider
      await refreshAuthState();
      
      // Close modal and redirect
      onClose();
      
      if (isAdminLogin) {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = CognitoServerAuthService.formatPhoneForCognito(phoneNumber);
      
      await resetPassword({
        username: formattedPhone,
      });
      
      setResetUsername(formattedPhone);
      setStep('reset-otp');
      setCountdown(60);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await confirmResetPassword({
        username: resetUsername,
        confirmationCode: otp,
        newPassword: newPassword,
      });

      // After successful password reset, sign in the user
      await signIn({
        username: resetUsername,
        password: newPassword,
      });

      // Refresh auth state to update the provider
      await refreshAuthState();
      
      // Close modal and redirect
      onClose();
      
      if (isAdminLogin) {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      if (step === 'reset-otp') {
        // Resend reset password OTP
        await resetPassword({
          username: resetUsername,
        });
      } else if (step === 'otp') {
        // Resend signup OTP - this would need to be handled differently
        // For now, we'll just show an error asking user to go back
        setError('Please go back and try signing up again to resend OTP.');
        return;
      }
      
      setCountdown(60);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get error message
  const getErrorMessage = (error: any): string => {
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

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim();
    }
    return cleaned.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2');
  };

  if (!isOpen) return null;

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
                {isAdminLogin ? 'Admin Login' : 
                 step === 'login' ? 'Login' : 
                 step === 'signup' ? 'Sign Up' : 
                 step === 'otp' ? 'Verify Phone' :
                 step === 'forgot-password' ? 'Reset Password' :
                 step === 'reset-otp' ? 'Verify Reset Code' :
                 'Set New Password'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'login' && 'Enter your phone number and password'}
                {step === 'signup' && 'Create your account with all required details'}
                {step === 'otp' && 'Enter the OTP sent to your phone number'}
                {step === 'forgot-password' && 'Enter your phone number to reset password'}
                {step === 'reset-otp' && 'Enter the reset code sent to your phone'}
                {step === 'new-password' && 'Create a new password for your account'}
              </p>
            </div>
            <button
              onClick={onClose}
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Step */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formatPhoneInput(phoneNumber)}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="98765 43210"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length !== 10 || !password}
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'LOGGING IN...' : 'LOGIN'}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot-password');
                    setError('');
                    setPhoneNumber('');
                  }}
                  className="text-sm text-black hover:text-gray-600 font-medium"
                >
                  Forgot Password?
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('signup');
                      setError(''); // Clear error when switching to signup
                      // Clear all form inputs when switching to signup
                      setPhoneNumber('');
                      setPassword('');
                      setFirstName('');
                      setLastName('');
                    }}
                    className="text-sm text-black hover:text-gray-600 font-medium"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Sign Up Step */}
          {step === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signupPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                  <input
                    id="signupPhone"
                    type="tel"
                    required
                    value={formatPhoneInput(phoneNumber)}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter Phone Number"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="signupPassword"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500'}
                  placeholder="Create a strong password"
                />
              </div>

              <button
                type="submit"
                disabled={
                  isLoading || 
                  phoneNumber.length !== 10 || 
                  !firstName.trim() || 
                  !lastName.trim() || 
                  !password
                }
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError(''); // Clear error when switching to login
                    // Clear all form inputs when switching to login
                    setPhoneNumber('');
                    setPassword('');
                    setFirstName('');
                    setLastName('');
                  }}
                  className="text-sm text-black hover:text-gray-600 font-medium"
                >
                  Already have an account? Login
                </button>
              </div>
            </form>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP <span className="text-red-500">*</span>
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  OTP sent to {CognitoServerAuthService.formatPhoneNumber(phoneNumber)}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'VERIFYING...' : 'VERIFY & CREATE ACCOUNT'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('signup');
                    setError(''); // Clear error when going back to signup
                    // Clear OTP when going back to signup
                    setOtp('');
                  }}
                  className="text-sm text-black hover:text-gray-600 font-medium"
                >
                  ← Back to sign up
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Step */}
          {step === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="resetPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                  <input
                    id="resetPhone"
                    type="tel"
                    required
                    value={formatPhoneInput(phoneNumber)}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="98765 43210"
                    maxLength={11}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the phone number associated with your account
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length !== 10}
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'SENDING CODE...' : 'SEND RESET CODE'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError('');
                    setPhoneNumber('');
                  }}
                  className="text-sm text-black hover:text-gray-600 font-medium"
                >
                  ← Back to login
                </button>
              </div>
            </form>
          )}

          {/* Reset OTP Verification Step */}
          {step === 'reset-otp' && (
            <form onSubmit={(e) => {
              e.preventDefault();
              setStep('new-password');
              setError('');
            }} className="space-y-4">
              <div>
                <label htmlFor="resetOtp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Reset Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="resetOtp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Reset code sent to {CognitoServerAuthService.formatPhoneNumber(phoneNumber)}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'VERIFYING...' : 'VERIFY CODE'}
              </button>

              <div className="text-center space-y-2">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend code in {countdown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-black hover:text-gray-600 font-medium disabled:opacity-50"
                  >
                    Resend reset code
                  </button>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('forgot-password');
                      setError('');
                      setOtp('');
                    }}
                    className="text-sm text-black hover:text-gray-600 font-medium"
                  >
                    ← Back to phone number
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* New Password Step */}
          {step === 'new-password' && (
            <form onSubmit={handleVerifyResetOTP} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    confirmPassword && newPassword !== confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  isLoading || 
                  !newPassword || 
                  !confirmPassword || 
                  newPassword !== confirmPassword
                }
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('reset-otp');
                    setError('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-sm text-black hover:text-gray-600 font-medium"
                >
                  ← Back to verification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}