'use client';

import { useState } from 'react';
import { useWishlist } from '@/components/providers/wishlist-provider';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
  showText?: boolean;
}

export default function WishlistButton({ 
  productId, 
  size = 'md', 
  variant = 'icon',
  className = '',
  showText = false
}: WishlistButtonProps) {
  const { wishlistStatus, toggleWishlist, loading } = useWishlist();
  const [isToggling, setIsToggling] = useState(false);
  
  // Use cached status from the hook
  const inWishlist = wishlistStatus[productId] || false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsToggling(true);
    try {
      await toggleWishlist(productId);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading || isToggling}
        className={`inline-flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          inWishlist
            ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
        } ${className}`}
      >
        {isToggling ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <svg
            className={sizeClasses[size]}
            fill={inWishlist ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
        {showText && (
          <span>
            {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || isToggling}
      className={`${buttonSizeClasses[size]} rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        inWishlist
          ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
          : 'text-gray-400 hover:text-red-500 bg-white hover:bg-red-50'
      } ${className}`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isToggling ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        <svg
          className={sizeClasses[size]}
          fill={inWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}