import { cookiesClient } from '@/utils/amplify-utils';

// Types
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

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  userId?: string;
}

const couponCache = new Map<string, CacheEntry<any>>();

// Helper: Check if cache entry is valid
function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.timestamp < CACHE_DURATION;
}

// Helper: Create cache key
function createCacheKey(prefix: string, userId?: string): string {
  return userId ? `${prefix}-${userId}` : `${prefix}-guest`;
}

// Helper: Check date validity
function isDateValid(validFrom: string, validUntil: string): { valid: boolean; error?: string } {
  const now = new Date();
  const from = new Date(validFrom);
  const until = new Date(validUntil);

  if (now < from) {
    return { valid: false, error: 'This coupon is not yet valid' };
  }

  if (now > until) {
    return { valid: false, error: 'This coupon has expired' };
  }

  return { valid: true };
}

// Helper: Check user eligibility
function checkUserEligibility(
  coupon: any,
  userId?: string
): { eligible: boolean; error?: string } {
  // If user-specific restrictions exist but no userId provided
  if (!userId) {
    if (
      (coupon.allowedUsers && coupon.allowedUsers.length > 0) ||
      (coupon.excludedUsers && coupon.excludedUsers.length > 0)
    ) {
      return { eligible: false, error: 'Please sign in to use this coupon' };
    }
    return { eligible: true };
  }

  // Check allowed users
  if (coupon.allowedUsers && coupon.allowedUsers.length > 0) {
    if (!coupon.allowedUsers.includes(userId)) {
      return { eligible: false, error: 'This coupon is not available for your account' };
    }
  }

  // Check excluded users
  if (coupon.excludedUsers && coupon.excludedUsers.length > 0) {
    if (coupon.excludedUsers.includes(userId)) {
      return { eligible: false, error: 'This coupon is not available for your account' };
    }
  }

  return { eligible: true };
}

// Helper: Check product eligibility
function checkProductEligibility(
  coupon: any,
  productIds: string[]
): { eligible: boolean; error?: string } {
  // Check applicable products
  if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
    const hasApplicableProduct = productIds.some((id) =>
      coupon.applicableProducts!.includes(id)
    );
    if (!hasApplicableProduct) {
      return { eligible: false, error: 'This coupon is not applicable to items in your cart' };
    }
  }

  // Check excluded products
  if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
    const hasExcludedProduct = productIds.some((id) =>
      coupon.excludedProducts!.includes(id)
    );
    if (hasExcludedProduct) {
      return {
        eligible: false,
        error: 'This coupon cannot be applied to some items in your cart',
      };
    }
  }

  return { eligible: true };
}

// Helper: Calculate discount amount
function calculateDiscountAmount(coupon: any, subtotal: number): number {
  let discountAmount = 0;

  if (coupon.type === 'percentage') {
    discountAmount = (subtotal * coupon.value) / 100;
    if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
      discountAmount = coupon.maximumDiscountAmount;
    }
  } else if (coupon.type === 'fixed_amount') {
    discountAmount = Math.min(coupon.value, subtotal);
  }

  return Math.round(discountAmount * 100) / 100;
}

/**
 * Get user's coupon usage count
 */
export async function getUserCouponUsage(userId: string, couponId: string): Promise<number> {
  try {
    const client = await cookiesClient;
    const { data, errors } = await client.models.UserCoupon.list({
      filter: {
        userId: { eq: userId },
        couponId: { eq: couponId },
      },
      authMode: 'userPool',
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
}

/**
 * Validate and apply a coupon
 */
export async function validateAndApplyCoupon(
  input: ApplyCouponInput
): Promise<CouponValidationResult> {
  try {
    const { code, userId, subtotal, productIds } = input;
    const client = await cookiesClient;

    // Fetch coupon by code
    const { data: coupons, errors } = await client.models.Coupon.list({
      filter: { code: { eq: code } },
      authMode: 'iam',
    });

    if (errors) {
      return { isValid: false, error: 'Failed to validate coupon' };
    }

    const coupon = coupons?.[0];
    if (!coupon) {
      return { isValid: false, error: 'Invalid coupon code' };
    }

    // Check if active
    if (!coupon.isActive) {
      return { isValid: false, error: 'This coupon is no longer active' };
    }

    // Check date validity
    const dateCheck = isDateValid(coupon.validFrom, coupon.validUntil);
    if (!dateCheck.valid) {
      return { isValid: false, error: dateCheck.error };
    }

    // Check minimum order amount
    if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
      return {
        isValid: false,
        error: `Minimum order amount of ₹${coupon.minimumOrderAmount} required`,
      };
    }

    // Check global usage limit
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
      return { isValid: false, error: 'This coupon has reached its usage limit' };
    }

    // Check user-specific usage limit
    if (userId && coupon.userUsageLimit) {
      const userUsage = await getUserCouponUsage(userId, coupon.id);
      if (userUsage >= coupon.userUsageLimit) {
        return {
          isValid: false,
          error: 'You have already used this coupon the maximum number of times',
        };
      }
    }

    // Check user eligibility
    const userCheck = checkUserEligibility(coupon, userId);
    if (!userCheck.eligible) {
      return { isValid: false, error: userCheck.error };
    }

    // Check product eligibility
    const productCheck = checkProductEligibility(coupon, productIds);
    if (!productCheck.eligible) {
      return { isValid: false, error: productCheck.error };
    }

    // Calculate discount
    const discountAmount = calculateDiscountAmount(coupon, subtotal);

    return {
      isValid: true,
      coupon,
      discountAmount,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { isValid: false, error: 'Failed to validate coupon' };
  }
}

/**
 * Record coupon usage
 */
export async function recordCouponUsage(userId: string, couponId: string): Promise<void> {
  try {
    const client = await cookiesClient;
    
    // Check for existing record
    const { data: existingRecords } = await client.models.UserCoupon.list({
      filter: {
        userId: { eq: userId },
        couponId: { eq: couponId },
      },
      authMode: 'userPool',
    });

    const existingRecord = existingRecords?.[0];

    if (existingRecord) {
      // Update existing record
      await client.models.UserCoupon.update({
        id: existingRecord.id,
        usageCount: (existingRecord.usageCount || 0) + 1,
        lastUsedAt: new Date().toISOString(),
      }, {
        authMode: 'userPool',
      });
    } else {
      // Create new record
      await client.models.UserCoupon.create({
        userId,
        couponId,
        usageCount: 1,
        lastUsedAt: new Date().toISOString(),
      }, {
        authMode: 'userPool',
      });
    }

    // Increment global usage count
    const { data: coupon } = await client.models.Coupon.get(
      { id: couponId },
      { authMode: 'iam' }
    );

    if (coupon) {
      await client.models.Coupon.update({
        id: couponId,
        usageCount: (coupon.usageCount || 0) + 1,
      }, {
        authMode: 'iam',
      });
    }
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    throw error;
  }
}

/**
 * Get header promotional coupon
 */
export async function getHeaderPromotionalCoupon(): Promise<any | null> {
  const cacheKey = 'header-promotional';
  const cached = couponCache.get(cacheKey);

  if (isCacheValid(cached)) {
    return cached.data;
  }

  try {
    const client = await cookiesClient;
    const now = new Date().toISOString();
    
    const { data, errors } = await client.models.Coupon.list({
      filter: {
        isActive: { eq: true },
        showOnHeader: { eq: true },
        validFrom: { le: now },
        validUntil: { ge: now },
      },
      authMode: 'iam',
      limit: 1,
    });

    if (errors) {
      console.error('Error fetching header promotional coupon:', errors);
      return null;
    }

    const coupon = data?.[0];
    
    // Check usage limit
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
}

/**
 * Get available coupons for a user
 */
export async function getAvailableCoupons(userId?: string): Promise<any[]> {
  const cacheKey = createCacheKey('available-coupons', userId);
  const cached = couponCache.get(cacheKey);

  if (isCacheValid(cached) && cached.userId === userId) {
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
      authMode: 'iam',
    });

    if (errors) {
      console.error('Error fetching available coupons:', errors);
      return [];
    }

    let availableCoupons = data || [];

    // Filter by global usage limit
    availableCoupons = availableCoupons.filter(
      (coupon) => !coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit
    );

    // Filter by user eligibility
    if (userId) {
      // Check user-specific restrictions
      availableCoupons = availableCoupons.filter((coupon) => {
        const userCheck = checkUserEligibility(coupon, userId);
        return userCheck.eligible;
      });

      // Check user usage limits
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
      // For guests, only show coupons without user restrictions
      availableCoupons = availableCoupons.filter((coupon) => {
        const userCheck = checkUserEligibility(coupon);
        return userCheck.eligible;
      });
    }

    // Cache the result
    couponCache.set(cacheKey, {
      data: availableCoupons,
      timestamp: Date.now(),
      userId,
    });

    return availableCoupons;
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    return [];
  }
}

/**
 * Format coupon for display
 */
export function formatCouponForDisplay(coupon: any) {
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

/**
 * Clear coupon cache
 */
export function clearCouponCache(userId?: string): void {
  if (userId) {
    const cacheKey = createCacheKey('available-coupons', userId);
    couponCache.delete(cacheKey);
  } else {
    couponCache.clear();
  }
}