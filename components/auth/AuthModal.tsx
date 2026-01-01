'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ConfirmSignupForm from './ConfirmSignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

type AuthStep = 'login' | 'signup' | 'confirm' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: AuthStep;
}

export default function AuthModal({ isOpen, onClose, initialStep = 'login' }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [signupEmail, setSignupEmail] = useState('');

  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignupSuccess = (email: string) => {
    setSignupEmail(email);
    setStep('confirm');
  };

  const handleConfirmSuccess = () => {
    setStep('login');
  };

  const handleForgotPasswordSuccess = () => {
    setStep('login');
  };

  const handleLoginSuccess = () => {
    onClose();
    // Refresh the page to update auth state
    window.location.reload();
  };

  const renderContent = () => {
    switch (step) {
      case 'login':
        return (
          <div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Sign In to Your Account
            </h2>
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToSignup={() => setStep('signup')}
              onSwitchToForgotPassword={() => setStep('forgot-password')}
            />
          </div>
        );

      case 'signup':
        return (
          <div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Create Your Account
            </h2>
            <SignupForm
              onSuccess={handleSignupSuccess}
              onSwitchToLogin={() => setStep('login')}
            />
          </div>
        );

      case 'confirm':
        return (
          <ConfirmSignupForm
            email={signupEmail}
            onSuccess={handleConfirmSuccess}
            onBack={() => setStep('signup')}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSuccess={handleForgotPasswordSuccess}
            onBack={() => setStep('login')}
          />
        );

      default:
        return null;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}