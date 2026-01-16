'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CartModal } from '@/components/cart';
import { useUser } from '@/hooks/use-user';
import { signOut } from '@/app/actions/auth-actions';
import { getCartItemCount } from '@/app/actions/cart-actions';
import { getWishlistCount } from '@/app/actions/wishlist-actions';
import PromotionalBanner from './PromotionalBanner';
import { SearchBar, UserAccountMenu, HeaderActions, MobileMenu } from './header/index';

interface HeaderProps {
  promotionalCoupon?: any | null;
}

export default function Header({ promotionalCoupon = null }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { isAuthenticated, user } = useUser();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // Fetch cart and wishlist counts
  useEffect(() => {
    const fetchCounts = async () => {
      const [cart, wishlist] = await Promise.all([
        getCartItemCount(),
        getWishlistCount()
      ]);
      setCartCount(cart);
      setWishlistCount(wishlist);
    };
    fetchCounts();
  }, [isCartModalOpen]); // Refetch when cart modal closes

  // Scroll detection with over-scroll prevention
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;

          // Prevent over-scrolling at the top
          if (scrollTop < 0) {
            window.scrollTo(0, 0);
            return;
          }

          setIsScrolled(scrollTop > 100);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Prevent touch-based over-scrolling on mobile
    const preventOverScroll = (e: TouchEvent) => {
      const scrollTop = window.scrollY;
      if (scrollTop <= 0 && e.touches[0].clientY > e.touches[0].clientY) {
        e.preventDefault();
      }
    };

    // Only add touch prevention on mobile devices
    if ('ontouchstart' in window) {
      document.addEventListener('touchmove', preventOverScroll, { passive: false });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if ('ontouchstart' in window) {
        document.removeEventListener('touchmove', preventOverScroll);
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      {/* Dynamic Promotional Banner */}
      <PromotionalBanner coupon={promotionalCoupon} />

      {/* Main Header */}
      <header className={`fixed left-0 right-0 z-40 transition-all duration-300 ${isScrolled || !isHomePage
          ? 'bg-white shadow-md text-black'
          : 'bg-transparent backdrop-blur-sm text-black'
        }`}>
        <div className="container mx-auto container-mobile">
          {/* Main header row */}
          <div className="flex items-center justify-between h-20 lg:h-28 px-6 sm:px-4">
            {/* Logo */}
            <Link
              href="/"
              className={`text-xl sm:text-2xl lg:text-3xl font-normal transition-colors rounded-md py-2 tracking-[0.15em] whitespace-nowrap flex-shrink-0 outline-none focus:outline-none ${isScrolled || !isHomePage
                  ? 'text-black hover:text-gray-700'
                  : 'text-black hover:text-gray-700'
                }`}
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              PRAYAN JEWELS
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
              {/* Desktop Search */}
              <div className="hidden lg:flex items-center">
                <SearchBar
                  isScrolled={isScrolled}
                  isHomePage={isHomePage}
                  onSearchStart={() => setIsMenuOpen(false)}
                />
              </div>

              {/* Header Action Icons */}
              <HeaderActions
                isScrolled={isScrolled}
                isHomePage={isHomePage}
                wishlistCount={wishlistCount}
                cartCount={cartCount}
                isAuthenticated={isAuthenticated}
                onCartClick={() => setIsCartModalOpen(true)}
                onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
                isMenuOpen={isMenuOpen}
              />

              {/* User Account Menu (Desktop only) */}
              <UserAccountMenu
                isScrolled={isScrolled}
                isHomePage={isHomePage}
                onSignOut={handleSignOut}
              />
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden px-3 sm:px-4 pb-4 pt-1">
            <SearchBar
              isScrolled={isScrolled}
              isHomePage={isHomePage}
              isMobile={true}
              onSearchStart={() => setIsMenuOpen(false)}
            />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        wishlistCount={wishlistCount}
        onSignOut={handleSignOut}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
      />
    </>
  );
}