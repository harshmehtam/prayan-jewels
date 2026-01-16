'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Copy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getAvailableCoupons, getUserCouponUsage } from '@/app/actions/coupon-actions';
import { useUser } from '@/hooks/use-user';

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
}

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
            </div>
          </div>
          
          {status === 'available' && (
            <div className="ml-2">
              <Badge variant="outline" className="text-xs">
                <Copy className="h-3 w-3 mr-1" />
                {coupon.code}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function UserCoupons() {
  const { user } = useUser();
  const [coupons, setCoupons] = useState<{
    available: CouponWithUsage[];
    used: CouponWithUsage[];
    expired: CouponWithUsage[];
  }>({ available: [], used: [], expired: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoupons = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        const allCoupons = await getAvailableCoupons();
        
        const now = new Date();
        const available: CouponWithUsage[] = [];
        const used: CouponWithUsage[] = [];
        const expired: CouponWithUsage[] = [];

        for (const coupon of allCoupons) {
          const userUsageCount = await getUserCouponUsage(user.userId, coupon.id);
          const isExpired = new Date(coupon.validUntil) < now;
          const isUsedUp = coupon.userUsageLimit && userUsageCount >= coupon.userUsageLimit;

          const couponWithUsage: CouponWithUsage = {
            ...coupon,
            description: coupon.description || undefined,
            type: coupon.type as 'percentage' | 'fixed_amount',
            userUsageCount,
          };

          if (isExpired) {
            expired.push(couponWithUsage);
          } else if (isUsedUp) {
            used.push(couponWithUsage);
          } else if (coupon.isActive) {
            available.push(couponWithUsage);
          }
        }

        setCoupons({ available, used, expired });
      } catch (error) {
        console.error('Error loading coupons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, [user]);

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
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading coupons...</p>
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
              Available ({coupons.available.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Used ({coupons.used.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Expired ({coupons.expired.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4 mt-4">
            {coupons.available.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available coupons at the moment</p>
                <p className="text-sm">Check back later for new offers!</p>
              </div>
            ) : (
              coupons.available.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} status="available" />
              ))
            )}
          </TabsContent>

          <TabsContent value="used" className="space-y-4 mt-4">
            {coupons.used.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No used coupons</p>
                <p className="text-sm">Coupons you've fully used will appear here</p>
              </div>
            ) : (
              coupons.used.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} status="used" />
              ))
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4 mt-4">
            {coupons.expired.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expired coupons</p>
                <p className="text-sm">Expired coupons will appear here</p>
              </div>
            ) : (
              coupons.expired.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} status="expired" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}