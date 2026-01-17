'use client';

import { useEffect, useState } from 'react';
import { getHeaderPromotionalCouponClient } from '@/app/actions/coupon-actions';

interface PromotionalBannerProps {
  coupon?: Record<string, unknown> | null;
}

export default function PromotionalBanner({ coupon: initialCoupon }: PromotionalBannerProps) {
  const [coupon, setCoupon] = useState<Record<string, unknown> | null>(initialCoupon || null);
  const [isLoading, setIsLoading] = useState(!initialCoupon);

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (!initialCoupon) {
      const fetchPromotionalCoupon = async () => {
        try {
          const data = await getHeaderPromotionalCouponClient();
          setCoupon(data);
        } catch (error) {
          console.error('Error fetching promotional coupon:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPromotionalCoupon();
    }
  }, [initialCoupon]);

  if (isLoading || !coupon) {
    return null;
  }
  
  const formatDiscount = (coupon: Record<string, unknown>) => {
    const type = coupon.type as string;
    const value = coupon.value as number;
    if (type === 'percentage') {
      return `${value}% OFF`;
    } else {
      return `₹${value} OFF`;
    }
  };

  const getPromotionText = (coupon: Record<string, unknown>) => {
    const discount = formatDiscount(coupon);
    const minOrder = coupon.minimumOrderAmount ? ` on Orders Over ₹${coupon.minimumOrderAmount as number}` : '';
    return `Get ${discount}${minOrder}`;
  };

  return (
    <div className="bg-gray-100 text-center py-3 px-2 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-center">
          <div className="flex items-center space-x-1 px-2">
            <span className="font-medium">
              {getPromotionText(coupon)}:
            </span>
            <span className="font-semibold px-2 py-1 whitespace-nowrap">
              Code {coupon.code as string}
            </span>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-center justify-center space-x-1 px-1">
            <span className="font-medium truncate">
              {formatDiscount(coupon)}
              {(coupon.minimumOrderAmount as number) && ` on ₹${coupon.minimumOrderAmount as number}+`}
            </span>
            <span className="font-semibold whitespace-nowrap">
              Code {coupon.code as string}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}