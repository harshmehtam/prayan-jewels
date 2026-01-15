'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Copy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { CouponService } from '@/lib/services/coupon-service';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useToast } from '@/hooks/use-toast';

const client = generateClient<Schema>();

interface UserCouponsProps {
  userId: string;
}

interface CouponWithUsage {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  userUsageCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  lastUsedAt?: string;
}

export default function UserCoupons({ userId }: UserCouponsProps) {
  const [availableCoupons, setAvailableCoupons] = useState<CouponWithUsage[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<CouponWithUsage[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<CouponWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserCoupons();
  }, [userId]);

  const loadUserCoupons = async () => {
    try {
      setLoading(true);

      // Get all coupons
      const allCoupons = await CouponService.getAvailableCoupons(userId);
      
      // Get user's coupon usage
      const { data: userCoupons } = await client.models.UserCoupon.list({
        filter: { userId: { eq: userId } }
      });

      const now = new Date();
      const available: CouponWithUsage[] = [];
      const used: CouponWithUsage[] = [];
      const expired: CouponWithUsage[] = [];

      for (const coupon of allCoupons) {
        const userUsage = userCoupons?.find(uc => uc.couponId === coupon.id);
        const userUsageCount = userUsage?.usageCount || 0;
        const isExpired = new Date(coupon.validUntil) < now;
        const isUsedUp = coupon.userUsageLimit && userUsageCount >= coupon.userUsageLimit;

        const couponWithUsage: CouponWithUsage = {
          ...coupon,
          description: coupon.description || undefined,
          type: coupon.type as 'percentage' | 'fixed_amount',
          userUsageCount,
          lastUsedAt: userUsage?.lastUsedAt || undefined,
        };

        if (isExpired) {
          expired.push(couponWithUsage);
        } else if (isUsedUp) {
          used.push(couponWithUsage);
        } else if (coupon.isActive) {
          available.push(couponWithUsage);
        }
      }

      setAvailableCoupons(available);
      setUsedCoupons(used);
      setExpiredCoupons(expired);
    } catch (error) {
      console.error('Error loading user coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coupons',
        variant: 'destructive',
      });
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

  const formatDiscount = (coupon: CouponWithUsage) => {
    return coupon.type === 'percentage' 
      ? `${coupon.value}% OFF`
      : `₹${coupon.value} OFF`;
  };

  const formatConditions = (coupon: CouponWithUsage) => {
    const conditions = [];
    if (coupon.minimumOrderAmount && coupon.minimumOrderAmount > 0) {
      conditions.push(`Min order ₹${coupon.minimumOrderAmount}`);
    }
    if (coupon.maximumDiscountAmount && coupon.type === 'percentage') {
      conditions.push(`Max discount ₹${coupon.maximumDiscountAmount}`);
    }
    return conditions.join(' • ');
  };

  const CouponCard = ({ coupon, status }: { coupon: CouponWithUsage; status: 'available' | 'used' | 'expired' }) => {
    return (
      <Card className={`${
        status === 'available' ? 'border-green-200 bg-green-50' :
        status === 'used' ? 'border-blue-200 bg-blue-50' :
        'border-gray-200 bg-gray-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant={status === 'available' ? 'default' : 'secondary'}
                  className="font-mono text-xs"
                >
                  {coupon.code}
                </Badge>
                <span className="font-medium text-sm">
                  {formatDiscount(coupon)}
                </span>
                {status === 'available' && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                )}
                {status === 'used' && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Used
                  </Badge>
                )}
                {status === 'expired' && (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1">{coupon.name}</h3>
              
              {coupon.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {coupon.description}
                </p>
              )}

              <div className="space-y-1 text-xs text-muted-foreground">
                {formatConditions(coupon) && (
                  <p>{formatConditions(coupon)}</p>
                )}
                <p>Valid until {new Date(coupon.validUntil).toLocaleDateString()}</p>
                
                {coupon.userUsageLimit && (
                  <p>
                    Usage: {coupon.userUsageCount} / {coupon.userUsageLimit}
                  </p>
                )}
                
                {coupon.lastUsedAt && (
                  <p>Last used: {new Date(coupon.lastUsedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            
            {status === 'available' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyCode(coupon.code)}
                className="ml-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            My Coupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse">Loading your coupons...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          My Coupons
        </CardTitle>
        <CardDescription>
          Manage your discount coupons and view usage history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Available ({availableCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Used ({usedCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Expired ({expiredCoupons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4 mt-4">
            {availableCoupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available coupons at the moment</p>
                <p className="text-sm">Check back later for new offers!</p>
              </div>
            ) : (
              availableCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} status="available" />
              ))
            )}
          </TabsContent>

          <TabsContent value="used" className="space-y-4 mt-4">
            {usedCoupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No used coupons</p>
                <p className="text-sm">Coupons you've fully used will appear here</p>
              </div>
            ) : (
              usedCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} status="used" />
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4 mt-4">
            {expiredCoupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expired coupons</p>
                <p className="text-sm">Expired coupons will appear here</p>
              </div>
            ) : (
              expiredCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} status="expired" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}