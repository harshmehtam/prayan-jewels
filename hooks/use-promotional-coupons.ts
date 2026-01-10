import { useState, useEffect } from 'react';
import { CouponService } from '@/lib/services/coupon-service';

export interface PromotionalCoupon {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderAmount?: number | null;
  maximumDiscountAmount?: number | null;
}

export function usePromotionalCoupons() {
  const [coupons, setCoupons] = useState<PromotionalCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotionalCoupons = async () => {
      try {
        setLoading(true);
        setError(null);
        const headerCoupons = await CouponService.getHeaderPromotionalCoupons();
        
        // Map the coupon data to our interface, filtering out invalid types
        const mappedCoupons: PromotionalCoupon[] = headerCoupons
          .filter(coupon => coupon.type === 'percentage' || coupon.type === 'fixed_amount')
          .map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            type: coupon.type as 'percentage' | 'fixed_amount',
            value: coupon.value,
            minimumOrderAmount: coupon.minimumOrderAmount,
            maximumDiscountAmount: coupon.maximumDiscountAmount,
          }));
        
        setCoupons(mappedCoupons);
      } catch (err) {
        console.error('Failed to fetch promotional coupons:', err);
        setError('Failed to load promotional offers');
      } finally {
        setLoading(false);
      }
    };

    fetchPromotionalCoupons();
  }, []);

  return {
    coupons,
    loading,
    error,
    hasPromotions: coupons.length > 0,
  };
}