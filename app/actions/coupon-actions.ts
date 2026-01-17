'use server';

import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import * as couponService from '@/lib/services/coupon-service';
import type { CouponValidationResult, ApplyCouponInput } from '@/lib/services/coupon-service';

/**
 * Validate and apply a coupon
 */
export async function validateAndApplyCoupon(
  input: ApplyCouponInput
): Promise<CouponValidationResult> {
  try {
    const result = await couponService.validateAndApplyCoupon(input);
    
    // If validation is successful, serialize the coupon object to remove function properties
    if (result.isValid && result.coupon) {
      const serializedCoupon = JSON.parse(JSON.stringify(result.coupon));
      
      return {
        ...result,
        coupon: {
          id: serializedCoupon.id,
          code: serializedCoupon.code,
          name: serializedCoupon.name,
          description: serializedCoupon.description,
          type: serializedCoupon.type,
          value: serializedCoupon.value,
          minimumOrderAmount: serializedCoupon.minimumOrderAmount,
          maximumDiscountAmount: serializedCoupon.maximumDiscountAmount,
          validFrom: serializedCoupon.validFrom,
          validUntil: serializedCoupon.validUntil,
          isActive: serializedCoupon.isActive,
        },
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      isValid: false,
      error: 'Failed to validate coupon. Please try again.',
    };
  }
}

/**
 * Record coupon usage
 */
export async function recordCouponUsage(
  userId: string,
  couponId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await couponService.recordCouponUsage(userId, couponId);
    revalidatePath('/checkout');
    revalidatePath('/account/coupons');
    return { success: true };
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return {
      success: false,
      error: 'Failed to record coupon usage',
    };
  }
}

/**
 * Get header promotional coupon
 */
export async function getHeaderPromotionalCoupon(): Promise<Record<string, unknown> | null> {
  try {
    return await couponService.getHeaderPromotionalCoupon();
  } catch (error) {
    console.error('Error getting header promotional coupon:', error);
    return null;
  }
}

/**
 * Get header promotional coupon for client-side use
 * This explicitly opts out of static rendering
 */
export async function getHeaderPromotionalCouponClient(): Promise<Record<string, unknown> | null> {
  noStore(); // Explicitly mark as dynamic
  try {
    const coupon = await couponService.getHeaderPromotionalCoupon();
    
    if (!coupon) {
      return null;
    }
    
    // Serialize to remove function properties
    const serializedCoupon = JSON.parse(JSON.stringify(coupon));
    
    // Return only serializable properties
    return {
      id: serializedCoupon.id,
      code: serializedCoupon.code,
      name: serializedCoupon.name,
      description: serializedCoupon.description,
      type: serializedCoupon.type,
      value: serializedCoupon.value,
      minimumOrderAmount: serializedCoupon.minimumOrderAmount,
      maximumDiscountAmount: serializedCoupon.maximumDiscountAmount,
      validFrom: serializedCoupon.validFrom,
      validUntil: serializedCoupon.validUntil,
      isActive: serializedCoupon.isActive,
      showOnHeader: serializedCoupon.showOnHeader,
      usageLimit: serializedCoupon.usageLimit,
      usageCount: serializedCoupon.usageCount,
      createdAt: serializedCoupon.createdAt,
      updatedAt: serializedCoupon.updatedAt,
    };
  } catch (error) {
    console.error('Error getting header promotional coupon:', error);
    return null;
  }
}

/**
 * Get available coupons for a user (formatted for display)
 */
export async function getAvailableCoupons(userId?: string): Promise<Array<Record<string, unknown>>> {
  try {
    const coupons = await couponService.getAvailableCoupons(userId);
    
    // Convert to plain objects and add formatted data
    return coupons.map((coupon) => {
      // Use JSON serialization to remove any function properties
      const serializedCoupon = JSON.parse(JSON.stringify(coupon));
      
      // Extract only the serializable properties
      const plainCoupon = {
        id: serializedCoupon.id,
        code: serializedCoupon.code,
        name: serializedCoupon.name,
        description: serializedCoupon.description,
        type: serializedCoupon.type,
        value: serializedCoupon.value,
        minimumOrderAmount: serializedCoupon.minimumOrderAmount,
        maximumDiscountAmount: serializedCoupon.maximumDiscountAmount,
        validFrom: serializedCoupon.validFrom,
        validUntil: serializedCoupon.validUntil,
        isActive: serializedCoupon.isActive,
        usageLimit: serializedCoupon.usageLimit,
        usageCount: serializedCoupon.usageCount,
        userUsageLimit: serializedCoupon.userUsageLimit,
        applicableProducts: serializedCoupon.applicableProducts,
        excludedProducts: serializedCoupon.excludedProducts,
        allowedUsers: serializedCoupon.allowedUsers,
        excludedUsers: serializedCoupon.excludedUsers,
        showOnHeader: serializedCoupon.showOnHeader,
        createdAt: serializedCoupon.createdAt,
        updatedAt: serializedCoupon.updatedAt,
      };

      // Add formatted data inline
      const discount = plainCoupon.type === 'percentage' 
        ? `${plainCoupon.value}% OFF` 
        : `₹${plainCoupon.value} OFF`;

      const conditions = [];
      if (plainCoupon.minimumOrderAmount && plainCoupon.minimumOrderAmount > 0) {
        conditions.push(`Min order ₹${plainCoupon.minimumOrderAmount}`);
      }
      if (plainCoupon.maximumDiscountAmount && plainCoupon.type === 'percentage') {
        conditions.push(`Max discount ₹${plainCoupon.maximumDiscountAmount}`);
      }

      return {
        ...plainCoupon,
        formatted: {
          code: plainCoupon.code,
          name: plainCoupon.name,
          description: plainCoupon.description,
          discount,
          conditions: conditions.join(' • '),
          validUntil: new Date(plainCoupon.validUntil).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        },
      };
    });
  } catch (error) {
    console.error('Error getting available coupons:', error);
    return [];
  }
}

/**
 * Get user's coupon usage count
 */
export async function getUserCouponUsage(
  userId: string,
  couponId: string
): Promise<number> {
  try {
    return await couponService.getUserCouponUsage(userId, couponId);
  } catch (error) {
    console.error('Error getting user coupon usage:', error);
    return 0;
  }
}

/**
 * Clear coupon cache
 */
export async function clearCouponCache(userId?: string): Promise<void> {
  try {
    couponService.clearCouponCache(userId);
    revalidatePath('/checkout');
    revalidatePath('/account/coupons');
  } catch (error) {
    console.error('Error clearing coupon cache:', error);
  }
}
