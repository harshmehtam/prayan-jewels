'use client';

import Link from 'next/link';
import { LoginButton } from '@/components/auth';

interface HeaderActionsProps {
  isScrolled: boolean;
  isHomePage: boolean;
  wishlistCount: number;
  isAuthenticated: boolean;
  onCartClick: () => void;
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export default function HeaderActions({ 
  isScrolled, 
  isHomePage, 
  wishlistCount, 
  isAuthenticated,
  onCartClick, 
  onMenuClick, 
  isMenuOpen 
}: HeaderActionsProps) {
  const iconClasses = (hidden?: string) => `${hidden || ''} relative p-2 transition-colors cursor-pointer outline-none focus:outline-none ${
    isScrolled || !isHomePage ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
  }`;

  return (
    <>
      {/* Track Order - Desktop and Tablet */}
      <Link 
        href="/track-order"
        className={iconClasses('hidden md:block')}
        style={{ outline: 'none', boxShadow: 'none' }}
        title="Track Order"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="sr-only">Track Order</span>
      </Link>

      {/* Wishlist - Hidden on very small screens, visible on sm+ */}
      <Link 
        href="/account/wishlist"
        className={iconClasses('hidden sm:block')}
        style={{ outline: 'none', boxShadow: 'none' }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {wishlistCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {wishlistCount}
          </span>
        )}
        <span className="sr-only">Wishlist ({wishlistCount})</span>
      </Link>

      {/* Login Button - Only show if not authenticated */}
      {!isAuthenticated && (
        <LoginButton 
          className={iconClasses('hidden sm:block')}
          variant="icon"
          redirectTo="/account"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="sr-only">Sign In</span>
        </LoginButton>
      )}

      {/* Cart - Always visible, essential for e-commerce */}
      <button 
        onClick={onCartClick}
        className={iconClasses()}
        style={{ outline: 'none', boxShadow: 'none' }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119.993z" />
        </svg>
        <span className="sr-only">Shopping cart</span>
      </button>

      {/* Mobile Menu Button - Always visible, essential for navigation */}
      <button
        onClick={onMenuClick}
        className={`lg:hidden touch-friendly p-1.5 sm:p-2 transition-colors rounded-md cursor-pointer outline-none focus:outline-none ${
          isScrolled || !isHomePage ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
        }`}
        style={{ outline: 'none', boxShadow: 'none' }}
        aria-expanded={isMenuOpen}
        aria-label="Toggle navigation menu"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
    </>
  );
}
