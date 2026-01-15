'use server';

import { revalidatePath } from 'next/cache';
import * as couponService from '@/lib/services/coupon-service';
import type { CouponValidationResult, ApplyCouponInput } from '@/lib/services/coupon-service';

/**
 * Validate and apply a coupon
 */
export async function validateAndApplyCoupon(
  input: ApplyCouponInput
): Promise<CouponValidationResult> {
  try {
    return await couponService.validateAndApplyCoupon(input);
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
export async function getHeaderPromotionalCoupon(): Promise<any | null> {
  try {
    return await couponService.getHeaderPromotionalCoupon();
  } catch (error) {
    console.error('Error getting header promotional coupon:', error);
    return null;
  }
}

/**
 * Get available coupons for a user (formatted for display)
 */
export async function getAvailableCoupons(userId?: string): Promise<any[]> {
  try {
    const coupons = await couponService.getAvailableCoupons(userId);
    
    // Format coupons for display using the service utility
    return coupons.map((coupon) => {
      const formatted = couponService.formatCouponForDisplay(coupon);
      return {
        ...coupon,
        formatted, // Add formatted data to the coupon object
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
