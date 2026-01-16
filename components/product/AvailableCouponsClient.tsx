'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Copy, Check } from 'lucide-react';

interface CouponWithSavings {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  potentialSaving: number;
  isApplicable: boolean;
}

interface AvailableCouponsClientProps {
  coupons: CouponWithSavings[];
}

export default function AvailableCouponsClient({ coupons }: AvailableCouponsClientProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedCoupons = showAll ? coupons : coupons.slice(0, 2);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-green-600" />
          <CardTitle className="text-lg">Available Offers</CardTitle>
        </div>
        <CardDescription>
          Save more on this product with these coupons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`p-3 rounded-lg border ${
              coupon.isApplicable
                ? 'bg-white border-green-200'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                    {coupon.code}
                  </code>
                  {coupon.isApplicable && (
                    <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                      Save ₹{coupon.potentialSaving}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{coupon.description}</p>
                {coupon.minimumOrderAmount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Min. order: ₹{coupon.minimumOrderAmount}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleCopyCode(coupon.code)}
                disabled={!coupon.isApplicable}
                className={`flex-shrink-0 p-2 rounded-md transition-colors ${
                  coupon.isApplicable
                    ? 'hover:bg-green-100 text-green-600'
                    : 'cursor-not-allowed text-gray-400'
                }`}
                aria-label="Copy coupon code"
              >
                {copiedCode === coupon.code ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        {coupons.length > 2 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-sm text-green-600 hover:text-green-700 font-medium py-2 transition-colors"
          >
            {showAll ? 'Show Less' : `View ${coupons.length - 2} More Offers`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
