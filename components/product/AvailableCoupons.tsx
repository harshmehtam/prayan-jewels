import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { getAvailableCoupons } from '@/app/actions/coupon-actions';
import { getCurrentUserServer } from '@/lib/services/auth-service';
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
    // If coupon has specific applicable products, check if this product is included
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      return coupon.applicableProducts.includes(productId);
    }
    
    // If coupon has excluded products, check if this product is not excluded
    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      return !coupon.excludedProducts.includes(productId);
    }
    
    // If no specific product restrictions, coupon is applicable
    return true;
  });

  // Calculate potential savings for each coupon
  const couponsWithSavings = applicableCoupons.map(coupon => {
    let potentialSaving = 0;
    
    if (coupon.type === 'percentage') {
      potentialSaving = (productPrice * coupon.value) / 100;
      if (coupon.maximumDiscountAmount && potentialSaving > coupon.maximumDiscountAmount) {
        potentialSaving = coupon.maximumDiscountAmount;
      }
    } else if (coupon.type === 'fixed_amount') {
      potentialSaving = Math.min(coupon.value, productPrice);
    }

    return {
      ...coupon,
      potentialSaving: Math.round(potentialSaving * 100) / 100,
      isApplicable: productPrice >= (coupon.minimumOrderAmount || 0),
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