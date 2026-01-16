'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import PhoneLoginModal from './Login';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
  redirectTo?: string;
  isAdminLogin?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  onModalOpen?: () => void;
}

export default function LoginButton({
  className = '',
  children,
  redirectTo = '/account',
  isAdminLogin = false,
  variant = 'primary',
  size = 'md',
  onModalOpen
}: LoginButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated, isLoading } = useUser();

  // Don't show login button if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 uppercase tracking-wider';

  const variantClasses = {
    primary: 'bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white focus:ring-gray-400',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
    icon: '', // No default styling for icon variant, use custom className
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // For icon variant, don't apply base classes and size classes
  const buttonClasses = variant === 'icon'
    ? className
    : `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <>
      <button
        onClick={() => {
          setIsModalOpen(true);
          onModalOpen?.();
        }}
        disabled={isLoading}
        className={buttonClasses}
      >
        {children || (
          <>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {isAdminLogin ? 'Admin Login' : 'Login with Phone'}
          </>
        )}
      </button>

      <PhoneLoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        redirectTo={redirectTo}
        isAdminLogin={isAdminLogin}
      />
    </>
  );
}