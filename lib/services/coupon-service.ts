import { getClient } from '@/lib/amplify-client';
import type { Schema } from '@/amplify/data/resource';

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

// Simple cache to prevent duplicate API calls
interface CacheEntry {
  data: any[];
  timestamp: number;
  userId?: string;
}

const CACHE_DURATION = 30000; // 30 seconds
const couponCache = new Map<string, CacheEntry>();

export class CouponService {
  static async validateAndApplyCoupon(input: ApplyCouponInput): Promise<CouponValidationResult> {
    try {
      const { code, userId, subtotal, productIds } = input;

      // Get appropriate client
      const client = await getClient();

      // Get coupon by code
      const { data: coupons, errors } = await client.models.Coupon.list({
        filter: { code: { eq: code } }
      });

      if (errors) {
        return { isValid: false, error: 'Failed to validate coupon' };
      }

      const coupon = coupons?.[0];
      if (!coupon) {
        return { isValid: false, error: 'Invalid coupon code' };
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return { isValid: false, error: 'This coupon is no longer active' };
      }

      // Check validity dates
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);

      if (now < validFrom) {
        return { isValid: false, error: 'This coupon is not yet valid' };
      }

      if (now > validUntil) {
        return { isValid: false, error: 'This coupon has expired' };
      }

      // Check minimum order amount
      if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
        return { 
          isValid: false, 
          error: `Minimum order amount of ₹${coupon.minimumOrderAmount} required` 
        };
      }

      // Check usage limits
      if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
        return { isValid: false, error: 'This coupon has reached its usage limit' };
      }

      // Check user-specific usage limit if user is logged in
      if (userId && coupon.userUsageLimit) {
        const userUsage = await this.getUserCouponUsage(userId, coupon.id);
        if (userUsage >= coupon.userUsageLimit) {
          return { 
            isValid: false, 
            error: 'You have already used this coupon the maximum number of times' 
          };
        }
      }

      // Check user restrictions
      if (userId) {
        // Check if user is in allowed users list (if specified)
        if (coupon.allowedUsers && coupon.allowedUsers.length > 0) {
          if (!coupon.allowedUsers.includes(userId)) {
            return {
              isValid: false,
              error: 'This coupon is not available for your account'
            };
          }
        }

        // Check if user is in excluded users list
        if (coupon.excludedUsers && coupon.excludedUsers.length > 0) {
          if (coupon.excludedUsers.includes(userId)) {
            return {
              isValid: false,
              error: 'This coupon is not available for your account'
            };
          }
        }
      } else {
        // If user is not logged in but coupon has user restrictions, deny access
        if ((coupon.allowedUsers && coupon.allowedUsers.length > 0) || 
            (coupon.excludedUsers && coupon.excludedUsers.length > 0)) {
          return {
            isValid: false,
            error: 'Please sign in to use this coupon'
          };
        }
      }

      // Check product applicability
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some(id => 
          coupon.applicableProducts!.includes(id)
        );
        if (!hasApplicableProduct) {
          return { 
            isValid: false, 
            error: 'This coupon is not applicable to items in your cart' 
          };
        }
      }

      // Check excluded products
      if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
        const hasExcludedProduct = productIds.some(id => 
          coupon.excludedProducts!.includes(id)
        );
        if (hasExcludedProduct) {
          return { 
            isValid: false, 
            error: 'This coupon cannot be applied to some items in your cart' 
          };
        }
      }

      // Calculate discount amount
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
        discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { isValid: false, error: 'Failed to validate coupon' };
    }
  }

  static async getUserCouponUsage(userId: string, couponId: string): Promise<number> {
    try {
      const client = await getClient();
      const { data, errors } = await client.models.UserCoupon.list({
        filter: {
          userId: { eq: userId },
          couponId: { eq: couponId },
        }
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

  static async recordCouponUsage(userId: string, couponId: string) {
    try {
      const client = await getClient();
      
      // Check if user coupon record exists
      const { data: existingRecords } = await client.models.UserCoupon.list({
        filter: {
          userId: { eq: userId },
          couponId: { eq: couponId },
        }
      });

      const existingRecord = existingRecords?.[0];

      if (existingRecord) {
        // Update existing record
        await client.models.UserCoupon.update({
          id: existingRecord.id,
          usageCount: (existingRecord.usageCount || 0) + 1,
          lastUsedAt: new Date().toISOString(),
        });
      } else {
        // Create new record
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
  }

  static async getHeaderPromotionalCoupons() {
    const cacheKey = 'header-promotional';
    const cached = couponCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const client = await getClient();
      const now = new Date().toISOString();
      const { data, errors } = await client.models.Coupon.list({
        filter: {
          isActive: { eq: true },
          showOnHeader: { eq: true },
          validFrom: { le: now },
          validUntil: { ge: now },
        }
      });

      if (errors) {
        console.error('Error fetching header promotional coupons:', errors);
        return [];
      }

      // Filter out coupons that have reached their usage limit
      const availableCoupons = (data || []).filter(coupon => 
        !coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit
      );

      // Cache the result
      couponCache.set(cacheKey, {
        data: availableCoupons,
        timestamp: Date.now()
      });

      return availableCoupons;
    } catch (error) {
      console.error('Error fetching header promotional coupons:', error);
      return [];
    }
  }

  static async getAvailableCoupons(userId?: string) {
    const cacheKey = `available-coupons-${userId || 'guest'}`;
    const cached = couponCache.get(cacheKey);
    
    // Return cached data if still valid and for the same user
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.userId === userId) {
      return cached.data;
    }

    try {
      const client = await getClient();
      const now = new Date().toISOString();
      
      const { data, errors } = await client.models.Coupon.list({
        filter: {
          isActive: { eq: true },
          validFrom: { le: now },
          validUntil: { ge: now },
        }
      });

      if (errors) {
        throw new Error(`Failed to fetch available coupons: ${errors.map(e => e.message).join(', ')}`);
      }

      let availableCoupons = data || [];

      // Filter out coupons that have reached their usage limit
      availableCoupons = availableCoupons.filter(coupon => 
        !coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit
      );

      // If user is provided, apply user-specific filters
      if (userId) {
        // Filter out coupons with user restrictions
        availableCoupons = availableCoupons.filter(coupon => {
          // Check if user is in allowed users list (if specified)
          if (coupon.allowedUsers && coupon.allowedUsers.length > 0) {
            if (!coupon.allowedUsers.includes(userId)) {
              return false; // User not in allowed list
            }
          }

          // Check if user is in excluded users list
          if (coupon.excludedUsers && coupon.excludedUsers.length > 0) {
            if (coupon.excludedUsers.includes(userId)) {
              return false; // User is excluded
            }
          }

          return true; // User can access this coupon
        });

        // Filter out coupons they've used up based on per-user limits
        const userCouponsPromises = availableCoupons.map(async (coupon) => {
          if (coupon.userUsageLimit) {
            const usage = await this.getUserCouponUsage(userId, coupon.id);
            return usage < coupon.userUsageLimit ? coupon : null;
          }
          return coupon;
        });

        const results = await Promise.all(userCouponsPromises);
        availableCoupons = results.filter(Boolean) as any[];
      } else {
        // If no user is provided, filter out coupons that have user restrictions
        availableCoupons = availableCoupons.filter(coupon => {
          // Only show coupons that don't have user restrictions when no user is logged in
          return (!coupon.allowedUsers || coupon.allowedUsers.length === 0) &&
                 (!coupon.excludedUsers || coupon.excludedUsers.length === 0);
        });
      }

      // Cache the result
      couponCache.set(cacheKey, {
        data: availableCoupons,
        timestamp: Date.now(),
        userId
      });

      return availableCoupons;
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      throw error;
    }
  }

  static formatCouponForDisplay(coupon: any) {
    const discount = coupon.type === 'percentage' 
      ? `${coupon.value}% OFF`
      : `₹${coupon.value} OFF`;

    let conditions = [];
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
  }
}