'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { LoginButton } from '@/components/auth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  wishlistCount: number;
  onSignOut: () => void;
}

export default function MobileMenu({ isOpen, onClose, isAuthenticated, wishlistCount, onSignOut }: MobileMenuProps) {
  // Prevent body scroll when mobile menu is open and add blur effect
  useEffect(() => {
    if (!isOpen) return;

    const mainContent = document.querySelector('main');
    const headerElement = document.querySelector('header');
    const bodyElement = document.body;
    const htmlElement = document.documentElement;

    // Prevent scrolling
    const scrollY = window.scrollY;
    bodyElement.style.overflow = 'hidden';
    htmlElement.style.overflow = 'hidden';
    bodyElement.style.position = 'fixed';
    bodyElement.style.top = `-${scrollY}px`;
    bodyElement.style.width = '100%';

    // Add blur effect
    if (mainContent) {
      mainContent.style.filter = 'blur(4px)';
      mainContent.style.transition = 'filter 0.3s ease-in-out';
    }
    if (headerElement) {
      headerElement.style.filter = 'blur(4px)';
      headerElement.style.transition = 'filter 0.3s ease-in-out';
    }

    return () => {
      // Restore scrolling
      bodyElement.style.overflow = '';
      htmlElement.style.overflow = '';
      bodyElement.style.position = '';
      bodyElement.style.top = '';
      bodyElement.style.width = '';
      window.scrollTo(0, scrollY);

      // Remove blur effect
      if (mainContent) mainContent.style.filter = 'none';
      if (headerElement) headerElement.style.filter = 'none';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignOut = () => {
    onClose();
    onSignOut();
  };

  return (
    <>
      {/* Invisible backdrop for click-to-close */}
      <div 
        className="lg:hidden fixed inset-0 z-[100]" 
        onClick={onClose}
      />
      
      {/* Sidebar drawer */}
      <div className="lg:hidden fixed top-0 right-0 w-80 h-screen z-[101] shadow-2xl">
        {/* Beautiful gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/40 via-orange-100/30 to-pink-100/40"></div>
          
          {/* Subtle decorative elements */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-yellow-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-pink-200/25 rounded-full blur-xl"></div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Close button header */}
          <div className="flex justify-end items-center p-6 border-b border-white/20 backdrop-blur-sm">
            <button
              onClick={onClose}
              className="p-3 text-gray-600 hover:text-gray-800 hover:bg-white/30 rounded-full transition-all duration-200 backdrop-blur-sm cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation menu */}
          <div className="px-6 py-8 overflow-y-auto flex-1">
            <nav>
              <div className="space-y-2">
                {/* Mobile-only links for hidden icons */}
                <div className="sm:hidden">
                  <Link
                    href="/account/wishlist"
                    className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm outline-none focus:outline-none"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    onClick={onClose}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">
                        Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {isAuthenticated ? (
                    <>
                      {/* Customer links */}
                      <Link
                        href="/account"
                        className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm outline-none focus:outline-none"
                        style={{ outline: 'none', boxShadow: 'none' }}
                        onClick={onClose}
                      >
                        <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">My Account</span>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      <Link
                        href="/account/orders"
                        className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm outline-none focus:outline-none"
                        style={{ outline: 'none', boxShadow: 'none' }}
                        onClick={onClose}
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Order History</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      <Link
                        href="/track-order"
                        className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm outline-none focus:outline-none"
                        style={{ outline: 'none', boxShadow: 'none' }}
                        onClick={onClose}
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Track Order</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      {/* Sign Out button */}
                      <button
                        onClick={handleSignOut}
                        className="w-full group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-red-50 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm outline-none focus:outline-none"
                        style={{ outline: 'none', boxShadow: 'none' }}
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-xl font-light tracking-wide group-hover:text-red-700 transition-colors">Sign Out</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-red-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <LoginButton 
                        className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm w-full text-left cursor-pointer outline-none focus:outline-none"
                        variant="icon"
                        redirectTo="/account"
                        onModalOpen={onClose}
                      >
                        <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Sign In</span>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </LoginButton>

                      <Link
                        href="/track-order"
                        className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm outline-none focus:outline-none"
                        style={{ outline: 'none', boxShadow: 'none' }}
                        onClick={onClose}
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Track Order</span>
                        </div>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Elegant bottom decoration */}
              <div className="mt-16">
                <div className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-light text-gray-600 tracking-wider">PRAYAN JEWELS</p>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
