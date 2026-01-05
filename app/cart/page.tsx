'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since we use cart modal instead
    router.push('/');
  }, [router]);

  return (
    <div className="pt-52 sm:pt-44 lg:pt-48 pb-4 sm:pb-8">
      <div className="container mx-auto container-mobile">
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
          </div>
          <h2 className="text-responsive-lg font-semibold text-gray-900 mb-2">
            Cart Access via Header
          </h2>
          <p className="text-gray-600 mb-6 text-responsive-sm">
            Click the cart icon in the header to view your shopping cart
          </p>
          <Link 
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block focus-ring text-responsive-sm"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}