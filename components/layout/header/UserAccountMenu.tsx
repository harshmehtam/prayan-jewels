'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/use-user';

interface UserAccountMenuProps {
  isScrolled: boolean;
  isHomePage: boolean;
  onSignOut: () => void;
}

export default function UserAccountMenu({ isScrolled, isHomePage, onSignOut }: UserAccountMenuProps) {
  const { isAuthenticated, user: userProfile } = useUser();

  const iconClasses = `flex items-center space-x-2 p-2 transition-colors cursor-pointer outline-none focus:outline-none ${isScrolled || !isHomePage ? 'text-black hover:text-gray-700' : 'text-black hover:text-gray-700'
    }`;

  if (!isAuthenticated) return null;

  return (
    <div className="relative group hidden sm:block">
      <button className={iconClasses} style={{ outline: 'none', boxShadow: 'none' }}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {/* User indicator */}
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="sr-only">Account menu</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
        {/* User info header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            {userProfile?.firstName && userProfile?.lastName
              ? `${userProfile.firstName} ${userProfile.lastName}`
              : 'User'
            }
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {userProfile?.role || 'Customer'}
          </p>
        </div>

        {/* Customer menu items */}
        <Link href="/account" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none focus:outline-none" style={{ outline: 'none', boxShadow: 'none' }}>My Account</Link>
        <Link href="/account/orders" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none focus:outline-none" style={{ outline: 'none', boxShadow: 'none' }}>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order History
          </div>
        </Link>
        <Link href="/track-order" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none focus:outline-none" style={{ outline: 'none', boxShadow: 'none' }}>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Track Order
          </div>
        </Link>
        <Link href="/account/wishlist" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none focus:outline-none" style={{ outline: 'none', boxShadow: 'none' }}>My Wishlist</Link>
        <hr className="my-1" />
        <button onClick={onSignOut} className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none focus:outline-none" style={{ outline: 'none', boxShadow: 'none' }}>Sign Out</button>
      </div>
    </div>
  );
}
