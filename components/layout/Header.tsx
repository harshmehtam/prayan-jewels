'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CartIcon } from '@/components/cart';
import { AuthModal } from '@/components/auth';
import { useAuth } from '@/components/providers/mock-auth-provider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<'login' | 'signup'>('login');
  const { user, isAuthenticated, signOut } = useAuth();

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
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto container-mobile">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors focus-ring rounded-md px-2 py-1"
            >
              Prayan Jewels
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md px-3 py-2"
              >
                Home
              </Link>
              <Link 
                href="/products" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md px-3 py-2"
              >
                Products
              </Link>
              <Link 
                href="/categories/traditional" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md px-3 py-2"
              >
                Traditional
              </Link>
              <Link 
                href="/categories/modern" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md px-3 py-2"
              >
                Modern
              </Link>
              <Link 
                href="/categories/designer" 
                className="text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md px-3 py-2"
              >
                Designer
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search Icon - Hidden on mobile, shown on tablet+ */}
              <button className="hidden sm:flex touch-friendly p-2 text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="sr-only">Search</span>
              </button>

              {/* Cart */}
              <CartIcon />

              {/* User Account */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="touch-friendly p-2 text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="sr-only">Account menu</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
                    <Link
                      href="/account"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 focus-ring"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 focus-ring"
                    >
                      Order History
                    </Link>
                    <Link
                      href="/account/addresses"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 focus-ring"
                    >
                      Addresses
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 focus-ring"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus-ring"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden touch-friendly p-2 text-gray-600 hover:text-gray-900 transition-colors focus-ring rounded-md"
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
            <div className="lg:hidden border-t border-gray-200 py-4 bg-white">
              <nav className="flex flex-col space-y-1">
                {/* Search on mobile */}
                <div className="px-3 py-2 sm:hidden">
                  <button className="w-full flex items-center justify-center touch-friendly p-3 text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 rounded-md focus-ring">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Products
                  </button>
                </div>

                <Link 
                  href="/" 
                  className="px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/products" 
                  className="px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  All Products
                </Link>
                <Link 
                  href="/categories/traditional" 
                  className="px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Traditional
                </Link>
                <Link 
                  href="/categories/modern" 
                  className="px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Modern
                </Link>
                <Link 
                  href="/categories/designer" 
                  className="px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Designer
                </Link>
                
                {/* Mobile Auth Buttons */}
                {isAuthenticated ? (
                  <div className="pt-4 border-t border-gray-200 space-y-1">
                    <Link
                      href="/account"
                      className="block px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Order History
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        openAuthModal('login');
                      }}
                      className="block w-full text-left px-3 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-md focus-ring"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        openAuthModal('signup');
                      }}
                      className="block w-full text-left px-3 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md focus-ring"
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