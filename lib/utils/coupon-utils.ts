/**
 * Client-side utility functions for coupon formatting
 * These are pure functions that don't require server access
 */

export interface FormattedCoupon {
  code: string;
  name: string;
  description: string;
  discount: string;
  conditions: string;
  validUntil: string;
}

/**
 * Format coupon for display (client-side utility)
 */
export function formatCouponForDisplay(coupon: Record<string, unknown>): FormattedCoupon {
  const type = coupon.type as string;
  const value = coupon.value as number;
  const minimumOrderAmount = coupon.minimumOrderAmount as number;
  const maximumDiscountAmount = coupon.maximumDiscountAmount as number | undefined;
  
  const discount =
    type === 'percentage' ? `${value}% OFF` : `₹${value} OFF`;

  const conditions = [];
  if (minimumOrderAmount > 0) {
    conditions.push(`Min order ₹${minimumOrderAmount}`);
  }
  if (maximumDiscountAmount && type === 'percentage') {
    conditions.push(`Max discount ₹${maximumDiscountAmount}`);
  }

  return {
    code: coupon.code as string,
    name: coupon.name as string,
    description: coupon.description as string,
    discount,
    conditions: conditions.join(' • '),
    validUntil: new Date(coupon.validUntil as string).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };
}
