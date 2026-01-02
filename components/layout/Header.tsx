'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AuthModal } from '@/components/auth';
import { useAuth } from '@/components/providers/auth-provider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<'login' | 'signup'>('login');
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, signOut } = useAuth();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open and add blur effect
  useEffect(() => {
    const mainContent = document.querySelector('main');
    const headerElement = document.querySelector('header');
    const bodyElement = document.body;
    const htmlElement = document.documentElement;
    
    if (isMenuOpen) {
      // Prevent scrolling on multiple elements
      bodyElement.style.overflow = 'hidden';
      htmlElement.style.overflow = 'hidden';
      bodyElement.style.position = 'fixed';
      bodyElement.style.top = `-${window.scrollY}px`;
      bodyElement.style.width = '100%';
      
      // Add blur effect to both main content and header
      if (mainContent) {
        mainContent.style.filter = 'blur(4px)';
        mainContent.style.transition = 'filter 0.3s ease-in-out';
      }
      
      if (headerElement) {
        headerElement.style.filter = 'blur(4px)';
        headerElement.style.transition = 'filter 0.3s ease-in-out';
      }
    } else {
      // Restore scrolling
      const scrollY = bodyElement.style.top;
      bodyElement.style.overflow = '';
      htmlElement.style.overflow = '';
      bodyElement.style.position = '';
      bodyElement.style.top = '';
      bodyElement.style.width = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      
      // Remove blur effect from both elements
      if (mainContent) {
        mainContent.style.filter = 'none';
      }
      
      if (headerElement) {
        headerElement.style.filter = 'none';
      }
    }

    // Cleanup on unmount
    return () => {
      bodyElement.style.overflow = '';
      htmlElement.style.overflow = '';
      bodyElement.style.position = '';
      bodyElement.style.top = '';
      bodyElement.style.width = '';
      if (mainContent) {
        mainContent.style.filter = 'none';
      }
      if (headerElement) {
        headerElement.style.filter = 'none';
      }
    };
  }, [isMenuOpen]);

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
      {/* Top Promotional Banner - Better mobile text wrapping */}
      <div className="bg-gray-100 text-center py-2 px-2 sm:px-4 text-xs sm:text-sm text-gray-800 border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-screen-xl mx-auto">
          <span className="font-medium">Enjoy 20% Off Your First Order Over $200:</span>
          <span className="font-semibold"> Code HELLO20</span>
        </div>
      </div>

      {/* Main Header - Dynamic background based on scroll */}
      <header className={`fixed top-8 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md text-black' 
          : 'bg-transparent backdrop-blur-sm text-black'
      }`}>
        <div className="container mx-auto container-mobile">
          {/* Main header row - Logo and icons with better mobile spacing */}
          <div className="flex items-center justify-between h-16 lg:h-18 px-3 sm:px-4 pt-2 lg:pt-0">
            {/* Logo - Responsive sizing */}
            <Link 
              href="/" 
              className={`text-lg sm:text-xl lg:text-2xl font-normal transition-colors focus-ring rounded-md py-2 tracking-[0.15em] whitespace-nowrap flex-shrink-0 ${
                isScrolled 
                  ? 'text-black hover:text-gray-700' 
                  : 'text-black hover:text-gray-700'
              }`}
            >
              PRAYAN JEWELS
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link 
                href="/categories/necklaces" 
                className={`transition-colors focus-ring rounded-md px-3 py-2 text-lg font-normal relative group ${
                  isScrolled 
                    ? 'text-black hover:text-gray-700' 
                    : 'text-black hover:text-gray-700'
                }`}
              >
                Necklaces
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isScrolled ? 'bg-black' : 'bg-black'
                }`}></span>
              </Link>
              <Link 
                href="/categories/earrings" 
                className={`transition-colors focus-ring rounded-md px-3 py-2 text-lg font-normal relative group ${
                  isScrolled 
                    ? 'text-black hover:text-gray-700' 
                    : 'text-black hover:text-gray-700'
                }`}
              >
                Earrings
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isScrolled ? 'bg-black' : 'bg-black'
                }`}></span>
              </Link>
              <Link 
                href="/categories/rings" 
                className={`transition-colors focus-ring rounded-md px-3 py-2 text-lg font-normal relative group ${
                  isScrolled 
                    ? 'text-black hover:text-gray-700' 
                    : 'text-black hover:text-gray-700'
                }`}
              >
                Rings
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isScrolled ? 'bg-black' : 'bg-black'
                }`}></span>
              </Link>
            </nav>

            {/* Right Side Actions - Optimized for very small screens */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
              {/* Desktop Search - Hidden on mobile */}
              <div className="hidden lg:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for a product or finish"
                    className={`w-72 pl-5 pr-12 py-3 text-base rounded-full focus:outline-none focus:ring-1 backdrop-blur-sm transition-all duration-300 ${
                      isScrolled
                        ? 'bg-gray-100 border border-gray-300 placeholder-gray-500 text-black focus:ring-gray-500 focus:border-gray-500'
                        : 'bg-white bg-opacity-20 border border-gray-400 border-opacity-30 placeholder-gray-600 text-black focus:ring-gray-500 focus:border-gray-500'
                    }`}
                  />
                  <button className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors cursor-pointer ${
                    isScrolled ? 'text-gray-500 hover:text-black' : 'text-gray-600 hover:text-black'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Wishlist - Hidden on very small screens, visible on sm+ */}
              <button className={`hidden sm:block p-2 transition-colors cursor-pointer ${
                isScrolled ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="sr-only">Wishlist</span>
              </button>

              {/* User Account - Hidden on very small screens, visible on sm+ */}
              {isAuthenticated ? (
                <div className="relative group hidden sm:block">
                  <button className={`p-2 transition-colors cursor-pointer ${
                    isScrolled ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="sr-only">Account menu</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
                    <Link href="/account" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">My Account</Link>
                    <Link href="/account/orders" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Order History</Link>
                    <Link href="/account/wishlist" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">My Wishlist</Link>
                    <hr className="my-1" />
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Sign Out</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => openAuthModal('login')} className={`hidden sm:block p-2 transition-colors cursor-pointer ${
                  isScrolled ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
                }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="sr-only">Sign In</span>
                </button>
              )}

              {/* Cart - Always visible, essential for e-commerce */}
              <button className={`relative p-1.5 sm:p-2 transition-colors cursor-pointer ${
                isScrolled ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
              }`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-black text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold text-[10px] sm:text-xs">
                  0
                </span>
                <span className="sr-only">Shopping cart</span>
              </button>

              {/* Mobile Menu Button - Always visible, essential for navigation */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`lg:hidden touch-friendly p-1.5 sm:p-2 transition-colors focus-ring rounded-md cursor-pointer ${
                  isScrolled ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
                }`}
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
            </div>
          </div>

          {/* Mobile Search Bar - Below main header on mobile/tablet with better spacing */}
          <div className="lg:hidden px-3 sm:px-4 pb-4 pt-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a product or finish"
                className={`w-full pl-5 pr-12 py-3 text-base rounded-full focus:outline-none focus:ring-1 backdrop-blur-sm transition-all duration-300 ${
                  isScrolled
                    ? 'bg-gray-100 border border-gray-300 placeholder-gray-500 text-black focus:ring-gray-500 focus:border-gray-500'
                    : 'bg-white bg-opacity-90 border border-gray-300 border-opacity-50 placeholder-gray-600 text-black focus:ring-gray-500 focus:border-gray-500'
                }`}
              />
              <button className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors cursor-pointer ${
                isScrolled ? 'text-gray-500 hover:text-black' : 'text-gray-600 hover:text-black'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Moved completely outside header to avoid blur inheritance */}
      {isMenuOpen && (
            <>
              {/* Invisible backdrop for click-to-close */}
              <div 
                className="lg:hidden fixed inset-0 z-[100]" 
                onClick={() => setIsMenuOpen(false)}
              />
              
              {/* Sidebar drawer - Enhanced with gradients and beautiful styling */}
              <div className="lg:hidden fixed top-0 right-0 w-80 h-screen z-[101] shadow-2xl">
                {/* Beautiful gradient background similar to hero section */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-100/40 via-orange-100/30 to-pink-100/40"></div>
                  
                  {/* Subtle decorative elements */}
                  <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-yellow-200/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-pink-200/25 rounded-full blur-xl"></div>
                </div>

                {/* Content overlay - Flex layout for proper scrolling */}
                <div className="relative z-10 h-full flex flex-col">
                  {/* Close button header */}
                  <div className="flex justify-end items-center p-6 border-b border-white/20 backdrop-blur-sm">
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-3 text-gray-600 hover:text-gray-800 hover:bg-white/30 rounded-full transition-all duration-200 backdrop-blur-sm cursor-pointer"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Navigation menu - Scrollable if needed */}
                  <div className="px-6 py-8 overflow-y-auto flex-1">
                    <nav>
                      <div className="space-y-2">
                        <Link
                          href="/categories/necklaces"
                          className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Necklaces</span>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>

                        <Link
                          href="/categories/earrings"
                          className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Earrings</span>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>

                        <Link
                          href="/categories/rings"
                          className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Rings</span>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </nav>

                    {/* Elegant bottom decoration */}
                    <div className="mt-16">
                      <div className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                      <div className="mt-4 text-center">
                        <p className="text-sm font-light text-gray-600 tracking-wider">PRAYAN JEWELS</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

      {/* Mobile Navigation - Moved completely outside header to avoid blur inheritance */}
      {isMenuOpen && (
        <>
          {/* Invisible backdrop for click-to-close */}
          <div 
            className="lg:hidden fixed inset-0 z-[100]" 
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Sidebar drawer - Enhanced with gradients and beautiful styling */}
          <div className="lg:hidden fixed top-0 right-0 w-80 h-screen z-[101] shadow-2xl">
            {/* Beautiful gradient background similar to hero section */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-100/40 via-orange-100/30 to-pink-100/40"></div>
              
              {/* Subtle decorative elements */}
              <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-yellow-200/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-pink-200/25 rounded-full blur-xl"></div>
            </div>

            {/* Content overlay - Flex layout for proper scrolling */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Close button header */}
              <div className="flex justify-end items-center p-6 border-b border-white/20 backdrop-blur-sm">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-3 text-gray-600 hover:text-gray-800 hover:bg-white/30 rounded-full transition-all duration-200 backdrop-blur-sm cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation menu - Scrollable if needed */}
              <div className="px-6 py-8 overflow-y-auto flex-1">
                <nav>
                  <div className="space-y-2">
                    <Link
                      href="/categories/necklaces"
                      className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Necklaces</span>
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    <Link
                      href="/categories/earrings"
                      className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Earrings</span>
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    <Link
                      href="/categories/rings"
                      className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Rings</span>
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    {/* Mobile-only links for hidden icons */}
                    <div className="sm:hidden">
                      <Link
                        href="/wishlist"
                        className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Wishlist</span>
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      {isAuthenticated ? (
                        <Link
                          href="/account"
                          className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">My Account</span>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            openAuthModal('login');
                          }}
                          className="group flex items-center justify-between py-5 px-4 text-gray-800 hover:bg-white/40 border-b border-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm w-full text-left cursor-pointer"
                        >
                          <span className="text-xl font-light tracking-wide group-hover:text-gray-900 transition-colors">Sign In</span>
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
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
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialStep={authModalStep}
      />
    </>
  );
}