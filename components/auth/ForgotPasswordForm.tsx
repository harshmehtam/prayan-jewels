'use client';

import { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await resetPassword({
        username: email,
      });
      setMessage('Password reset code sent! Please check your email.');
      setStep('confirm');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });

      setMessage('Password reset successfully! You can now sign in with your new password.');
      
      // Call success callback after a short delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Confirm reset error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a reset code
          </p>
        </div>

        <form onSubmit={handleRequestReset} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>

          {onBack && (
            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Back to sign in
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Enter New Password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter the code sent to <strong>{email}</strong> and your new password
        </p>
      </div>

      <form onSubmit={handleConfirmReset} className="space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Reset Code
          </label>
          <input
            id="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
            placeholder="Enter reset code"
            maxLength={6}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter new password"
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be at least 8 characters long
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm new password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {message && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setStep('request')}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            Back to email entry
          </button>
        </div>
      </form>
    </div>
  );
}