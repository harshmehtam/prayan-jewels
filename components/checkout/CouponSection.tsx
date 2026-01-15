'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Tag, X, Check } from 'lucide-react';
import * as couponActions from '@/app/actions/coupon-actions';
import type { CouponValidationResult } from '@/lib/services/coupon-service';
import { useToast } from '@/hooks/use-toast';

interface CouponSectionProps {
  subtotal: number;
  productIds: string[];
  userId?: string;
  appliedCoupon?: {
    id: string;
    code: string;
    name: string;
    discountAmount: number;
  } | null;
  onCouponApplied: (coupon: any, discountAmount: number) => void;
  onCouponRemoved: () => void;
}

export default function CouponSection({
  subtotal,
  productIds,
  userId,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
}: CouponSectionProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setValidationError('Please enter a coupon code');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const result: CouponValidationResult = await couponActions.validateAndApplyCoupon({
        code: couponCode.trim().toUpperCase(),
        userId,
        subtotal,
        productIds,
      });

      if (result.isValid && result.coupon && result.discountAmount !== undefined) {
        onCouponApplied(result.coupon, result.discountAmount);
        setCouponCode('');
        toast({
          title: 'Coupon Applied!',
          description: `You saved ₹${result.discountAmount.toFixed(2)}`,
        });
      } else {
        setValidationError(result.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setValidationError('Failed to apply coupon. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    toast({
      title: 'Coupon Removed',
      description: 'The coupon has been removed from your order',
    });
  };

  const loadAvailableCoupons = async () => {
    try {
      const coupons = await couponActions.getAvailableCoupons(userId);
      setAvailableCoupons(coupons);
      setShowAvailableCoupons(true);
    } catch (error) {
      console.error('Error loading available coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available coupons',
        variant: 'destructive',
      });
    }
  };

  const handleQuickApply = async (code: string) => {
    setCouponCode(code);
    setShowAvailableCoupons(false);
    
    // Auto-apply the coupon
    setTimeout(() => {
      handleApplyCoupon();
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Coupon Code
        </CardTitle>
        <CardDescription>
          Have a coupon? Enter it here to get a discount on your order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{appliedCoupon.name}</p>
                <p className="text-sm text-green-600">
                  Code: {appliedCoupon.code} • Saved ₹{appliedCoupon.discountAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="coupon-code" className="sr-only">
                  Coupon Code
                </Label>
                <Input
                  id="coupon-code"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setValidationError('');
                  }}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      handleApplyCoupon();
                    }
                  }}
                  disabled={isValidating}
                />
              </div>
              <Button
                onClick={handleApplyCoupon}
                disabled={isValidating || !couponCode.trim()}
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <Button
                variant="link"
                size="sm"
                onClick={loadAvailableCoupons}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                View available coupons
              </Button>
            </div>
          </div>
        )}

        {showAvailableCoupons && availableCoupons.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Available Coupons:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleQuickApply(coupon.code)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {coupon.formatted.code}
                      </Badge>
                      <span className="font-medium text-sm">{coupon.formatted.discount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {coupon.formatted.name}
                    </p>
                    {coupon.formatted.conditions && (
                      <p className="text-xs text-muted-foreground">
                        {coupon.formatted.conditions}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Valid until {coupon.formatted.validUntil}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAvailableCoupons(false)}
              className="w-full"
            >
              Hide coupons
            </Button>
          </div>
        )}

        {showAvailableCoupons && availableCoupons.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No coupons available at the moment</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAvailableCoupons(false)}
              className="mt-2"
            >
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}