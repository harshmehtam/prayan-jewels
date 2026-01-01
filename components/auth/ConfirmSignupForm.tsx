'use client';

import { useState } from 'react';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

interface ConfirmSignupFormProps {
  email: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function ConfirmSignupForm({ email, onSuccess, onBack }: ConfirmSignupFormProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      setMessage('Account confirmed successfully! You can now sign in.');
      
      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Confirmation error:', error);
      setError(error.message || 'Failed to confirm account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setMessage('');

    try {
      await resendSignUpCode({
        username: email,
      });
      setMessage('Confirmation code sent! Please check your email.');
    } catch (error: any) {
      console.error('Resend error:', error);
      setError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Confirm Your Account</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a confirmation code to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Confirmation Code
          </label>
          <input
            id="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
            placeholder="Enter 6-digit code"
            maxLength={6}
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
          {isLoading ? 'Confirming...' : 'Confirm Account'}
        </button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending}
            className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend confirmation code'}
          </button>

          {onBack && (
            <div>
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Back to sign up
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}