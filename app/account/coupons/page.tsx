'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UserCoupons from '@/components/account/UserCoupons';
import { useUser } from '@/hooks/use-user';

export default function AccountCouponsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const mounted = typeof window !== 'undefined';

  useEffect(() => {
    if (!isLoading && !user?.userId && mounted) {
      router.push('/');
    }
  }, [user, isLoading, mounted, router]);

  if (!mounted || isLoading) {
    return (
      <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.userId) {
    return null;
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
        <UserCoupons />
      </div>
    </div>
  );
}