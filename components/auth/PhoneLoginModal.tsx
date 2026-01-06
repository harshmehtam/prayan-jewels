'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { CognitoServerAuthService } from '@/lib/services/cognito-server-auth';
import { signUp, confirmSignUp, signIn, confirmResetPassword, resetPassword, resendSignUpCode } from 'aws-amplify/auth';

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  isAdminLogin?: boolean;
}

type Step = 'phone' | 'otp' | 'details';

export default function PhoneLoginModal({ 
  isOpen, 
  onClose, 
  redirectTo = '/account',
  isAdminLogin = false 
}: PhoneLoginModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  
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
      setStep('phone');
      setPhoneNumber('');
      setOtp('');
      setFirstName('');
      setLastName('');
      setError('');
      setCountdown(0);
      setIsNewUser(false);
      
      // Prevent body scroll when modal is open - more comprehensive approach
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use client-side Amplify to send OTP
      const formattedPhone = CognitoServerAuthService.formatPhoneForCognito(phoneNumber);
      
      try {
        // First try to sign up (for new users)
        await signUp({
          username: formattedPhone,
          password: generateTempPassword(formattedPhone),
          options: {
            userAttributes: {
              phone_number: formattedPhone,
              // Set default attributes for new users
              'custom:role': 'customer',
              'custom:newsletter': 'false',
              'custom:smsUpdates': 'true',
              'custom:preferredCategories': '[]',
            },
          },
        });
        
        setStep('otp');
        setCountdown(60);
        setIsNewUser(true);
      } catch (signUpError: any) {
        if (signUpError.name === 'UsernameExistsException') {
          // User exists, try reset password flow
          try {
            await resetPassword({ username: formattedPhone });
            setStep('otp');
            setCountdown(60);
            setIsNewUser(false);
          } catch (resetPasswordError: any) {
            console.error('Reset password error:', resetPasswordError);
            setError('Failed to send OTP. Please try again.');
          }
        } else {
          console.error('SignUp error:', signUpError);
          setError('Failed to send OTP. Please try again.');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate consistent temp password based on phone
  const generateTempPassword = (phone?: string) => {
    const basePhone = phone || phoneNumber;
    const cleanPhone = basePhone.replace(/\D/g, '');
    return `TempPass${cleanPhone}!2024`;
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = CognitoServerAuthService.formatPhoneForCognito(phoneNumber);

      if (isNewUser) {
        // For new users, confirm signup
        console.log('🆕 Confirming signup for new user:', formattedPhone);
        await confirmSignUp({
          username: formattedPhone,
          confirmationCode: otp,
        });

        // After confirmation, sign in the user
        console.log('🔐 Signing in new user after confirmation');
        const signInResult = await signIn({
          username: formattedPhone,
          password: generateTempPassword(formattedPhone),
        });
        console.log('✅ New user signed in successfully:', signInResult);
      } else {
        // For existing users, confirm reset password
        console.log('🔄 Confirming password reset for existing user:', formattedPhone);
        const newPassword = generateTempPassword(formattedPhone);
        await confirmResetPassword({
          username: formattedPhone,
          confirmationCode: otp,
          newPassword: newPassword,
        });

        // Sign in with the new password
        console.log('🔐 Signing in existing user with new password');
        const signInResult = await signIn({
          username: formattedPhone,
          password: newPassword,
        });
        console.log('✅ Existing user signed in successfully:', signInResult);
      }

      // Refresh auth state to update the provider
      await refreshAuthState();
      
      // Update user profile with additional data from form (stored in Cognito attributes)
      if (isNewUser && firstName.trim() && lastName.trim()) {
        await updateUserProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }
      
      // Close modal and redirect
      onClose();
      
      if (isAdminLogin) {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to create user profile
  // Helper function to get error message
  const getErrorMessage = (error: any): string => {
    switch (error.name) {
      case 'CodeMismatchException':
        return 'Invalid OTP. Please try again.';
      case 'ExpiredCodeException':
        return 'OTP has expired. Please request a new one.';
      case 'LimitExceededException':
        return 'Too many attempts. Please try again later.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      const formattedPhone = CognitoServerAuthService.formatPhoneForCognito(phoneNumber);

      if (isNewUser) {
        // For new users, resend confirmation code
        await resendSignUpCode({ username: formattedPhone });
      } else {
        // For existing users, initiate reset password again
        await resetPassword({ username: formattedPhone });
      }

      setCountdown(60);
      setError('');
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
        {/* Gradient backdrop - No onClick handler to prevent closing on outside click */}
        <div 
          className="fixed inset-0 transition-all duration-300 ease-out"
        >
          {/* Yellow to pink gradient like the reference */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-yellow-100 to-pink-200"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-transparent to-pink-300/40"></div>
          
          {/* Subtle overlay for better modal contrast */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        {/* Modal */}
        <div className="relative bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 border border-white/20 transform transition-all duration-300 scale-100 opacity-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isAdminLogin ? 'Admin Login' : 'Login / Sign Up'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'phone' && 'Enter your mobile number'}
                {step === 'otp' && !isNewUser && 'Enter the OTP to login to your account'}
                {step === 'otp' && isNewUser && 'Enter the OTP and your details to create account'}
                {step === 'details' && 'Complete your profile'}
              </p>
            </div>
            {/* Close button - Only way to close the modal */}
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

          {/* Phone Number Step */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
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
                <p className="text-xs text-gray-500 mt-1">
                  We'll send you an OTP to verify your number
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length !== 10}
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'SENDING OTP...' : 'SEND OTP'}
              </button>
            </form>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
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

              {/* Name fields for new users only */}
              {isNewUser && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required={isNewUser}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        isNewUser && !firstName.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
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
                      required={isNewUser}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        isNewUser && !lastName.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Last name"
                    />
                  </div>
                </div>
              )}

              {/* User type indicator */}
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                  isNewUser 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {isNewUser ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Creating new account - Please provide your details
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      Logging into existing account
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isLoading || 
                  otp.length !== 6 || 
                  (isNewUser && (!firstName.trim() || !lastName.trim()))
                }
                className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'VERIFYING...' : (isNewUser ? 'CREATE ACCOUNT' : 'LOGIN')}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className="text-sm text-black hover:text-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>

              {/* Back button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-sm text-black hover:text-gray-600 font-medium"
                >
                  ← Change phone number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}