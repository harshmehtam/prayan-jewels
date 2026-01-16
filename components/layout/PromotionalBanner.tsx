interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderAmount?: number | null;
}

interface PromotionalBannerProps {
  coupon: Coupon | null;
}

export default function PromotionalBanner({ coupon }: PromotionalBannerProps) {
  // Don't render if no coupon
  if (!coupon) {
    return null;
  }
  
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF`;
    } else {
      return `₹${coupon.value} OFF`;
    }
  };

  const getPromotionText = (coupon: Coupon) => {
    const discount = formatDiscount(coupon);
    const minOrder = coupon.minimumOrderAmount ? ` on Orders Over ₹${coupon.minimumOrderAmount}` : '';
    return `Get ${discount}${minOrder}`;
  };

  return (
    <div className="bg-gray-100 text-center py-3 px-2 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-center">
          <div className="flex items-center space-x-1 px-2">
            <span className="font-medium">
              {getPromotionText(coupon)}:
            </span>
            <span className="font-semibold px-2 py-1 whitespace-nowrap">
              Code {coupon.code}
            </span>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-center justify-center space-x-1 px-1">
            <span className="font-medium truncate">
              {formatDiscount(coupon)}
              {coupon.minimumOrderAmount && ` on ₹${coupon.minimumOrderAmount}+`}
            </span>
            <span className="font-semibold whitespace-nowrap">
              Code {coupon.code}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}