import React from 'react';
import { getAvailableCoupons } from '@/app/actions/coupon-actions';
import { getCurrentUserServer } from '@/lib/services/auth-service.server';
import AvailableCouponsClient from './AvailableCouponsClient';

interface AvailableCouponsProps {
  productId: string;
  productPrice: number;
}

export default async function AvailableCoupons({ productId, productPrice }: AvailableCouponsProps) {
  // Fetch user and coupons on the server
  const user = await getCurrentUserServer();
  const userId = user?.userId;

  // Load available coupons
  const allCoupons = await getAvailableCoupons(userId);
  
  // Filter coupons applicable to this product
  const applicableCoupons = allCoupons.filter(coupon => {
    const couponData = coupon as Record<string, unknown>;
    const applicableProducts = couponData.applicableProducts as string[] | undefined;
    const excludedProducts = couponData.excludedProducts as string[] | undefined;
    
    // If coupon has specific applicable products, check if this product is included
    if (applicableProducts && applicableProducts.length > 0) {
      return applicableProducts.includes(productId);
    }
    
    // If coupon has excluded products, check if this product is not excluded
    if (excludedProducts && excludedProducts.length > 0) {
      return !excludedProducts.includes(productId);
    }
    
    // If no specific product restrictions, coupon is applicable
    return true;
  });

  // Calculate potential savings for each coupon
  const couponsWithSavings = applicableCoupons.map(coupon => {
    const couponData = coupon as Record<string, unknown>;
    let potentialSaving = 0;
    
    if (couponData.type === 'percentage') {
      potentialSaving = (productPrice * (couponData.value as number)) / 100;
      if (couponData.maximumDiscountAmount && potentialSaving > (couponData.maximumDiscountAmount as number)) {
        potentialSaving = couponData.maximumDiscountAmount as number;
      }
    } else if (couponData.type === 'fixed_amount') {
      potentialSaving = Math.min(couponData.value as number, productPrice);
    }

    return {
      id: couponData.id as string,
      code: couponData.code as string,
      description: (couponData.description as string) || '',
      type: couponData.type as 'percentage' | 'fixed_amount',
      value: couponData.value as number,
      minimumOrderAmount: couponData.minimumOrderAmount as number | undefined,
      maximumDiscountAmount: couponData.maximumDiscountAmount as number | undefined,
      potentialSaving: Math.round(potentialSaving * 100) / 100,
      isApplicable: productPrice >= ((couponData.minimumOrderAmount as number) || 0),
    };
  });

  // Sort by potential savings (highest first)
  couponsWithSavings.sort((a, b) => b.potentialSaving - a.potentialSaving);

  if (couponsWithSavings.length === 0) {
    return null;
  }

  // Pass data to client component for interactivity
  return <AvailableCouponsClient coupons={couponsWithSavings} />;
}