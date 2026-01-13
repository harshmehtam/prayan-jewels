'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';

const client = generateClient<Schema>();

interface AvailableCouponsProps {
  productId: string;
  productPrice: number;
}

export default function AvailableCoupons({ productId, productPrice }: AvailableCouponsProps) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCoupons();
  }, [productId, userProfile?.userId]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      
      const now = new Date().toISOString();
      const userId = userProfile?.userId;

      // Load available coupons
      const { data: allCoupons, errors } = await client.models.Coupon.list({
        filter: {
          isActive: { eq: true },
          validFrom: { le: now },
          validUntil: { ge: now },
        },
      });

      if (errors) {
        console.error('Error fetching coupons:', errors);
        return;
      }

      let availableCoupons = allCoupons || [];

      // Filter out coupons that have reached usage limit
      availableCoupons = availableCoupons.filter(
        (coupon) => !coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit
      );

      // Filter by user restrictions
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

        // Check user usage limits
        const userCouponsPromises = availableCoupons.map(async (coupon) => {
          if (coupon.userUsageLimit) {
            const { data: userCoupons } = await client.models.UserCoupon.list({
              filter: {
                userId: { eq: userId },
                couponId: { eq: coupon.id },
              },
            });
            const usage = userCoupons?.[0]?.usageCount || 0;
            return usage < coupon.userUsageLimit ? coupon : null;
          }
          return coupon;
        });

        const results = await Promise.all(userCouponsPromises);
        availableCoupons = results.filter(Boolean) as any[];
      } else {
        // For guests, only show coupons without user restrictions
        availableCoupons = availableCoupons.filter(
          (coupon) =>
            (!coupon.allowedUsers || coupon.allowedUsers.length === 0) &&
            (!coupon.excludedUsers || coupon.excludedUsers.length === 0)
        );
      }
      
      // Filter coupons applicable to this product
      const applicableCoupons = availableCoupons.filter(coupon => {
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

      setCoupons(couponsWithSavings);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: `Coupon code ${code} copied to clipboard`,
    });
  };

  const formatDiscount = (coupon: any) => {
    return coupon.type === 'percentage' 
      ? `${coupon.value}% OFF`
      : `₹${coupon.value} OFF`;
  };

  const formatConditions = (coupon: any) => {
    const conditions = [];
    if (coupon.minimumOrderAmount > 0) {
      conditions.push(`Min order ₹${coupon.minimumOrderAmount}`);
    }
    if (coupon.maximumDiscountAmount && coupon.type === 'percentage') {
      conditions.push(`Max discount ₹${coupon.maximumDiscountAmount}`);
    }
    return conditions.join(' • ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading available coupons...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  const displayCoupons = expanded ? coupons : coupons.slice(0, 2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4" />
          Available Coupons
        </CardTitle>
        <CardDescription>
          Save more on this product with these exclusive offers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`p-3 border rounded-lg ${
              coupon.isApplicable 
                ? 'border-green-200 bg-green-50' 
                : 'border-orange-200 bg-orange-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={coupon.isApplicable ? 'default' : 'secondary'}
                    className="font-mono text-xs"
                  >
                    {coupon.code}
                  </Badge>
                  <span className="font-medium text-sm">
                    {formatDiscount(coupon)}
                  </span>
                  {coupon.isApplicable && coupon.potentialSaving > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Save ₹{coupon.potentialSaving}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {coupon.name}
                </p>
                {coupon.description && (
                  <p className="text-xs text-muted-foreground mb-1">
                    {coupon.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {formatConditions(coupon) && (
                    <span>{formatConditions(coupon)}</span>
                  )}
                  <span>•</span>
                  <span>Valid until {new Date(coupon.validUntil).toLocaleDateString()}</span>
                </div>
                {!coupon.isApplicable && (
                  <p className="text-xs text-orange-600 mt-1">
                    Minimum order amount: ₹{coupon.minimumOrderAmount}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyCode(coupon.code)}
                className="ml-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
        ))}

        {coupons.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {coupons.length - 2} More Coupons
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}