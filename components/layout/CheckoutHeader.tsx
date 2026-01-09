'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function CheckoutHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBackToShopping = () => {
    router.push('/');
  };

  // Don't show confirmation on order confirmation page
  const isOrderConfirmation = pathname.startsWith('/order-confirmation');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Back to Shopping */}
          {/* <button
            onClick={handleBackToShopping}
            className="flex items-center text-sm text-gray-600 hover:text-black transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Shopping
          </button> */}

          {/* Centered Brand Logo */}
          {isOrderConfirmation ? (
            <Link
              href="/"
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-normal text-black hover:text-gray-700 transition-colors tracking-[0.15em] outline-none focus:outline-none"
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              PRAYAN JEWELS
            </Link>
          ) : (
            <Link
              href="/"
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-normal text-black hover:text-gray-700 transition-colors tracking-[0.15em] outline-none focus:outline-none"
              style={{ outline: 'none', boxShadow: 'none' }}
              onClick={(e) => {
                e.preventDefault();
                handleBackToShopping();
              }}
            >
              PRAYAN JEWELS
            </Link>
          )}

          {/* Secure Checkout Badge */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure Checkout
          </div>
        </div>
      </div>
    </header>
  );
}