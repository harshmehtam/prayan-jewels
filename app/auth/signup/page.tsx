'use client';

import { SignupForm } from '@/components/auth';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { ConfirmSignupForm } from '@/components/auth';

// Prevent SSR for this page
export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [email, setEmail] = useState('');

  const handleSignupSuccess = (userEmail: string) => {
    setEmail(userEmail);
    setStep('confirm');
  };

  const handleConfirmSuccess = () => {
    // Redirect to login or account page
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-bold text-gray-900">Prayan Jewels</h1>
          </Link>
          {step === 'signup' ? (
            <>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Or{' '}
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                  sign in to your existing account
                </Link>
              </p>
            </>
          ) : (
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Confirm your account
            </h2>
          )}
        </div>
        
        {step === 'signup' ? (
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <SignupForm 
              onSuccess={handleSignupSuccess}
              onSwitchToLogin={() => window.location.href = '/auth/login'}
            />
          </Suspense>
        ) : (
          <ConfirmSignupForm
            email={email}
            onSuccess={handleConfirmSuccess}
            onBack={() => setStep('signup')}
          />
        )}
      </div>
    </div>
  );
}