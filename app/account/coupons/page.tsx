'use client';

import { useAuth } from '@/components/providers/auth-provider';
import UserCoupons from '@/components/account/UserCoupons';
import Link from 'next/link';

export default function AccountCouponsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user?.userId) {
    return (
      <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in</h3>
            <p className="text-gray-600 mb-6">You need to be signed in to view your coupons</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Go to Home & Sign In
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/account"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Coupons</h1>
          </div>
          <p className="text-gray-600">
            View and manage your discount coupons
          </p>
        </div>

        {/* User Coupons Component */}
        <UserCoupons userId={user.userId} />
      </div>
    </div>
  );
}