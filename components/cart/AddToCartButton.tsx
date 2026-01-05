'use client';

import { useState } from 'react';
import { useCart } from '@/components/providers/cart-provider';
import type { Product } from '@/types';

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
  disabled?: boolean;
  buttonText?: string;
}

export function AddToCartButton({ 
  product, 
  quantity = 1, 
  className = '',
  disabled = false,
  buttonText = 'Add to Cart'
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (disabled || isAdding) return;

    setIsAdding(true);
    try {
      await addItem(product.id, quantity, product.price);
      
      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      // You could add toast notification here
    } finally {
      setIsAdding(false);
    }
  };

  const baseClasses = `
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const buttonClasses = showSuccess
    ? `${baseClasses} bg-green-600 text-white px-6 py-3 rounded-lg font-medium focus:ring-green-500`
    : className 
      ? `${baseClasses} ${className}`
      : `${baseClasses} px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={buttonClasses}
      aria-label={`Add ${product.name} to cart`}
    >
      {isAdding ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Adding...
        </span>
      ) : showSuccess ? (
        <span className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Added to Cart!
        </span>
      ) : (
        buttonText
      )}
    </button>
  );
}