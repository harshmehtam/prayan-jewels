'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthModal } from '@/components/auth';
import { useAuth } from '@/components/providers/auth-provider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<'login' | 'signup'>('login');
  const { isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Refresh the page to update auth state
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const openAuthModal = (step: 'login' | 'signup') => {
    setAuthModalStep(step);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      {/* Top Promotional Banner - Very thin like in image */}
      <div className="bg-gray-100 text-center py-2 px-4 text-xs text-gray-800 border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <span className="font-medium">Enjoy 20% Off Your First Order Over $200:</span>
        <span className="font-semibold"> Code HELLO20</span>
      </div>

      {/* Main Header - Compact like in image */}
      <header className="bg-black bg-opacity-40 backdrop-blur-sm fixed top-8 left-0 right-0 z-40 text-white">
        <div className="container mx-auto container-mobile">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo - Larger and more readable */}
            <Link 
              href="/" 
              className="text-lg sm:text-xl font-normal text-white hover:text-gray-200 transition-colors focus-ring rounded-md px-2 py-1 tracking-[0.15em]"
            >
              PRAYAN JEWELS
            </Link>

            {/* Desktop Navigation - Larger fonts */}
            <nav className="hidden lg:flex items-center space-x-10">
              <Link 
                href="/categories/necklaces" 
                className="text-white hover:text-white transition-colors focus-ring rounded-md px-3 py-2 text-base font-normal relative group"
              >
                Necklaces
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link 
                href="/categories/earrings" 
                className="text-white hover:text-white transition-colors focus-ring rounded-md px-3 py-2 text-base font-normal relative group"
              >
                Earrings
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link 
                href="/categories/rings" 
                className="text-white hover:text-white transition-colors focus-ring rounded-md px-3 py-2 text-base font-normal relative group"
              >
                Rings
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search - Fixed styling */}
              <div className="hidden sm:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for a product or fin..."
                    className="w-64 pl-4 pr-10 py-2 text-sm bg-white bg-opacity-10 border border-white border-opacity-20 rounded-full placeholder-gray-300 text-white focus:outline-none focus:ring-1 focus:ring-white focus:border-white backdrop-blur-sm"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Icons - Fixed spacing and styling */}
              <button className="p-2 text-white hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="sr-only">Wishlist</span>
              </button>

              {/* User Account */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="p-2 text-white hover:text-gray-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="sr-only">Account menu</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
                    <Link href="/account" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">My Account</Link>
                    <Link href="/account/orders" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">Order History</Link>
                    <Link href="/account/wishlist" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">My Wishlist</Link>
                    <hr className="my-1" />
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => openAuthModal('login')} className="p-2 text-white hover:text-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="sr-only">Sign In</span>
                </button>
              )}

              {/* Cart - Fixed styling */}
              <button className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7H6L5 9z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-white text-gray-900 text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                  0
                </span>
                <span className="sr-only">Shopping cart</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden touch-friendly p-2 text-white hover:text-white transition-colors focus-ring rounded-md"
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-white border-opacity-20 py-4 bg-black bg-opacity-30 backdrop-blur-sm">
              <nav className="flex flex-col space-y-1">
                {/* Search on mobile */}
                <div className="px-3 py-2 sm:hidden">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for a product..."
                      className="w-full pl-4 pr-10 py-3 text-sm bg-black bg-opacity-20 border border-white border-opacity-30 rounded-full placeholder-white placeholder-opacity-70 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent backdrop-blur-sm"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white text-opacity-70 hover:text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <Link 
                  href="/categories/necklaces" 
                  className="px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Necklaces
                </Link>
                <Link 
                  href="/categories/earrings" 
                  className="px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Earrings
                </Link>
                <Link 
                  href="/categories/rings" 
                  className="px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Rings
                </Link>
                
                {/* Mobile Auth Buttons */}
                {isAuthenticated ? (
                  <div className="pt-4 border-t border-white border-opacity-20 space-y-1">
                    <Link
                      href="/account"
                      className="block px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Order History
                    </Link>
                    <Link
                      href="/account/wishlist"
                      className="block px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Wishlist
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-white border-opacity-20 space-y-2">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        openAuthModal('login');
                      }}
                      className="block w-full text-left px-3 py-3 text-white hover:text-white hover:bg-white hover:bg-opacity-10 transition-colors rounded-md focus-ring"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        openAuthModal('signup');
                      }}
                      className="block w-full text-left px-3 py-3 bg-white text-gray-900 hover:bg-gray-100 transition-colors rounded-md focus-ring"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialStep={authModalStep}
      />
    </>
  );
}