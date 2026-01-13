import { cookiesClient } from '@/utils/amplify-utils';

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: any;
  error?: string;
  discountAmount?: number;
}

export interface ApplyCouponInput {
  code: string;
  userId?: string;
  subtotal: number;
  productIds: string[];
}

const CACHE_DURATION = 30000; // 30 seconds
const couponCache = new Map<string, { data: any; timestamp: number; userId?: string }>();

export const validateAndApplyCoupon = async (input: ApplyCouponInput): Promise<CouponValidationResult> => {
  try {
    const { code, userId, subtotal, productIds } = input;
    const client = await cookiesClient;

    const { data: coupons, errors } = await client.models.Coupon.list({
      filter: { code: { eq: code } },
    });

    if (errors) {
      return { isValid: false, error: 'Failed to validate coupon' };
    }

    const coupon = coupons?.[0];
    if (!coupon) {
      return { isValid: false, error: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
      return { isValid: false, error: 'This coupon is no longer active' };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom) {
      return { isValid: false, error: 'This coupon is not yet valid' };
    }

    if (now > validUntil) {
      return { isValid: false, error: 'This coupon has expired' };
    }

    if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
      return {
        isValid: false,
        error: `Minimum order amount of ₹${coupon.minimumOrderAmount} required`,
      };
    }

    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return { isValid: false, error: 'This coupon has reached its usage limit' };
    }

    if (userId && coupon.userUsageLimit) {
      const userUsage = await getUserCouponUsage(userId, coupon.id);
      if (userUsage >= coupon.userUsageLimit) {
        return {
          isValid: false,
          error: 'You have already used this coupon the maximum number of times',
        };
      }
    }

    if (userId) {
      if (coupon.allowedUsers && coupon.allowedUsers.length > 0 && !coupon.allowedUsers.includes(userId)) {
        return { isValid: false, error: 'This coupon is not available for your account' };
      }

      if (coupon.excludedUsers && coupon.excludedUsers.length > 0 && coupon.excludedUsers.includes(userId)) {
        return { isValid: false, error: 'This coupon is not available for your account' };
      }
    } else {
      if (
        (coupon.allowedUsers && coupon.allowedUsers.length > 0) ||
        (coupon.excludedUsers && coupon.excludedUsers.length > 0)
      ) {
        return { isValid: false, error: 'Please sign in to use this coupon' };
      }
    }

    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds.some((id) => coupon.applicableProducts!.includes(id));
      if (!hasApplicableProduct) {
        return { isValid: false, error: 'This coupon is not applicable to items in your cart' };
      }
    }

    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      const hasExcludedProduct = productIds.some((id) => coupon.excludedProducts!.includes(id));
      if (hasExcludedProduct) {
        return { isValid: false, error: 'This coupon cannot be applied to some items in your cart' };
      }
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (subtotal * coupon.value) / 100;
      if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
        discountAmount = coupon.maximumDiscountAmount;
      }
    } else if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    return {
      isValid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { isValid: false, error: 'Failed to validate coupon' };
  }
};

export const getUserCouponUsage = async (userId: string, couponId: string): Promise<number> => {
  try {
    const client = await cookiesClient;
    const { data, errors } = await client.models.UserCoupon.list({
      filter: {
        userId: { eq: userId },
        couponId: { eq: couponId },
      },
    });

    if (errors) {
      console.error('Error fetching user coupon usage:', errors);
      return 0;
    }

    return data?.[0]?.usageCount || 0;
  } catch (error) {
    console.error('Error fetching user coupon usage:', error);
    return 0;
  }
};

export const recordCouponUsage = async (userId: string, couponId: string) => {
  try {
    const client = await cookiesClient;
    const { data: existingRecords } = await client.models.UserCoupon.list({
      filter: {
        userId: { eq: userId },
        couponId: { eq: couponId },
      },
    });

    const existingRecord = existingRecords?.[0];

    if (existingRecord) {
      await client.models.UserCoupon.update({
        id: existingRecord.id,
        usageCount: (existingRecord.usageCount || 0) + 1,
        lastUsedAt: new Date().toISOString(),
      });
    } else {
      await client.models.UserCoupon.create({
        userId,
        couponId,
        usageCount: 1,
        lastUsedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    throw error;
  }
};

export const getHeaderPromotionalCoupons = async () => {
  const cacheKey = 'header-promotional';
  const cached = couponCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const now = new Date().toISOString();
    const response = await cookiesClient.models.Coupon.list({
      filter: {
        isActive: { eq: true },
        showOnHeader: { eq: true },
        validFrom: { le: now },
        validUntil: { ge: now },
      },
      authMode: 'iam',
      limit: 1,
    });

    const { data, errors } = response;

    if (errors) {
      console.error('Error fetching header promotional coupon:', errors);
      return null;
    }

    // Get the first coupon if it exists
    const coupon = data?.[0];
    
    // Check if coupon is within usage limit
    if (coupon && (!coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit)) {
      couponCache.set(cacheKey, {
        data: coupon,
        timestamp: Date.now(),
      });
      return coupon;
    }

    return null;
  } catch (error) {
    console.error('Error fetching header promotional coupon:', error);
    return null;
  }
};

export const getAvailableCoupons = async (userId?: string) => {
  const cacheKey = `available-coupons-${userId || 'guest'}`;
  const cached = couponCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.userId === userId) {
    return cached.data;
  }

  try {
    const client = await cookiesClient;
    const now = new Date().toISOString();

    const { data, errors } = await client.models.Coupon.list({
      filter: {
        isActive: { eq: true },
        validFrom: { le: now },
        validUntil: { ge: now },
      },
    });

    if (errors) {
      throw new Error(`Failed to fetch available coupons: ${errors.map((e) => e.message).join(', ')}`);
    }

    let availableCoupons = data || [];

    availableCoupons = availableCoupons.filter(
      (coupon) => !coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit
    );

    if (userId) {
      availableCoupons = availableCoupons.filter((coupon) => {
        if (coupon.allowedUsers && coupon.allowedUsers.length > 0 && !coupon.allowedUsers.includes(userId)) {
          return false;
        }

        if (coupon.excludedUsers && coupon.excludedUsers.length > 0 && coupon.excludedUsers.includes(userId)) {
          return false;
        }

        return true;
      });

      const userCouponsPromises = availableCoupons.map(async (coupon) => {
        if (coupon.userUsageLimit) {
          const usage = await getUserCouponUsage(userId, coupon.id);
          return usage < coupon.userUsageLimit ? coupon : null;
        }
        return coupon;
      });

      const results = await Promise.all(userCouponsPromises);
      availableCoupons = results.filter(Boolean) as any[];
    } else {
      availableCoupons = availableCoupons.filter(
        (coupon) =>
          (!coupon.allowedUsers || coupon.allowedUsers.length === 0) &&
          (!coupon.excludedUsers || coupon.excludedUsers.length === 0)
      );
    }

    couponCache.set(cacheKey, {
      data: availableCoupons,
      timestamp: Date.now(),
      userId,
    });

    return availableCoupons;
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    throw error;
  }
};

export const formatCouponForDisplay = (coupon: any) => {
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
    validUntil: new Date(coupon.validUntil).toLocaleDateString(),
  };
};