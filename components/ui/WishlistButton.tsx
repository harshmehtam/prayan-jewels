'use client';

import { useState, useEffect } from 'react';
import * as wishlistActions from '@/app/actions/wishlist-actions';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
  showText?: boolean;
}

export default function WishlistButton({ 
  productId,
  productName,
  productPrice,
  productImage,
  size = 'md', 
  variant = 'icon',
  className = '',
  showText = false
}: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if item is in wishlist on mount
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const status = await wishlistActions.isInWishlist(productId);
        setInWishlist(status);
      } catch (error) {
        console.error('Error checking wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWishlist();
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      if (inWishlist) {
        const result = await wishlistActions.removeFromWishlist(productId);
        if (result.success) {
          setInWishlist(false);
        }
      } else {
        const result = await wishlistActions.addToWishlist(productId);
        if (result.success) {
          setInWishlist(true);
        } else if (result.error === 'Item already in wishlist') {
          setInWishlist(true);
        }
      }
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
        disabled={isLoading || isToggling}
        className={`inline-flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          inWishlist
            ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
        } ${className}`}
      >
        {isToggling || isLoading ? (
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
      disabled={isLoading || isToggling}
      className={`${buttonSizeClasses[size]} rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        inWishlist
          ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
          : 'text-gray-400 hover:text-red-500 bg-white hover:bg-red-50'
      } ${className}`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isToggling || isLoading ? (
        <div className={`animate-spin border-2 border-current border-t-transparent rounded-full ${sizeClasses[size]}`} />
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