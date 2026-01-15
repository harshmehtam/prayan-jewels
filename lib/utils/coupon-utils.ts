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
export function formatCouponForDisplay(coupon: any): FormattedCoupon {
  const discount =
    coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;

  const conditions = [];
  if (coupon.minimumOrderAmount > 0) {
    conditions.push(`Min order ₹${coupon.minimumOrderAmount}`);
  }
  if (coupon.maximumDiscountAmount && coupon.type === 'percentage') {
    conditions.push(`Max discount ₹${coupon.maximumDiscountAmount}`);
  }

  return {
    code: coupon.code,
    name: coupon.name,
    description: coupon.description,
    discount,
    conditions: conditions.join(' • '),
    validUntil: new Date(coupon.validUntil).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };
}
