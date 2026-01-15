'use client';

import { useState, useTransition } from 'react';
import { CartModal } from './CartModal';
import { addToCart } from '@/app/actions/cart-actions';
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
  const [showCartModal, setShowCartModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    if (disabled || isPending) return;

    startTransition(async () => {
      try {
        const result = await addToCart(product.id, quantity, product.price);
        
        if (result.success) {
          // Show cart modal after adding item
          setShowCartModal(true);
        } else {
          console.error('Error adding to cart:', result.error);
          // You could add toast notification here
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        // You could add toast notification here
      }
    });
  };

  const baseClasses = `
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const buttonClasses = className 
    ? `${baseClasses} ${className}`
    : `${baseClasses} px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white`;

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={disabled || isPending}
        className={buttonClasses}
        aria-label={`Add ${product.name} to cart`}
      >
        {isPending ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </span>
        ) : (
          buttonText
        )}
      </button>

      {/* Cart Modal */}
      <CartModal 
        isOpen={showCartModal} 
        onClose={() => setShowCartModal(false)} 
      />
    </>
  );
}