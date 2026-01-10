'use client';

import { useState } from 'react';
import { usePromotionalCoupons } from '@/hooks/use-promotional-coupons';

export default function PromotionalBanner() {
  const { coupons, hasPromotions, loading, error } = usePromotionalCoupons();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Don't render if loading
  if (loading) {
    return null;
  }

  // Don't render if error
  if (error) {
    return null;
  }

  // Don't render if no promotions
  if (!hasPromotions) {
    return null;
  }

  const currentCoupon = coupons[currentIndex];
  
  const formatDiscount = (coupon: typeof currentCoupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF`;
    } else {
      return `₹${coupon.value} OFF`;
    }
  };

  const getPromotionText = (coupon: typeof currentCoupon) => {
    const discount = formatDiscount(coupon);
    const minOrder = coupon.minimumOrderAmount ? ` on Orders Over ₹${coupon.minimumOrderAmount}` : '';
    return `Get ${discount}${minOrder}`;
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % coupons.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + coupons.length) % coupons.length);
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy coupon code:', err);
    }
  };

  return (
    <div className="bg-gray-100 text-center py-1.5 px-2 sm:py-2 sm:px-4 text-xs sm:text-sm lg:text-base text-gray-800 border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Previous button - only show if multiple coupons */}
          {coupons.length > 1 && (
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              aria-label="Previous promotion"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Main content */}
          <div className="flex-1 flex items-center justify-center space-x-1 px-2">
            <span className="font-medium">
              {getPromotionText(currentCoupon)}:
            </span>
            <button
              onClick={() => copyToClipboard(currentCoupon.code)}
              className="font-semibold hover:bg-gray-200 px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap"
              title="Click to copy code"
            >
              Code {currentCoupon.code}
            </button>
          </div>

          {/* Next button - only show if multiple coupons */}
          {coupons.length > 1 && (
            <button
              onClick={handleNext}
              className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              aria-label="Next promotion"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Layout - Single Line */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between space-x-2">
            {/* Navigation - Left */}
            {coupons.length > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                aria-label="Previous promotion"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Main content - Center */}
            <div className="flex-1 flex items-center justify-center space-x-1 min-w-0 px-1">
              <span className="font-medium text-xs truncate">
                {formatDiscount(currentCoupon)}
                {currentCoupon.minimumOrderAmount && ` on ₹${currentCoupon.minimumOrderAmount}+`}
              </span>
              <span className="text-xs text-gray-600">•</span>
              <button
                onClick={() => copyToClipboard(currentCoupon.code)}
                className="font-semibold hover:bg-gray-200 px-1 py-0.5 rounded transition-colors cursor-pointer text-xs whitespace-nowrap"
                title="Click to copy code"
              >
                {currentCoupon.code}
              </button>
            </div>

            {/* Navigation - Right */}
            {coupons.length > 1 && (
              <button
                onClick={handleNext}
                className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                aria-label="Next promotion"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Mobile dots indicator - only if multiple coupons */}
          {coupons.length > 1 && (
            <div className="flex justify-center space-x-1 mt-1">
              {coupons.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-1 h-1 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-gray-600' : 'bg-gray-400'
                  }`}
                  aria-label={`Go to promotion ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop dots indicator - only show on larger screens */}
      {coupons.length > 1 && (
        <div className="hidden sm:flex justify-center space-x-1 mt-1">
          {coupons.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentIndex ? 'bg-gray-600' : 'bg-gray-400'
              }`}
              aria-label={`Go to promotion ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}