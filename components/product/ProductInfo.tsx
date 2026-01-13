import { CompactStarRating } from '@/components/ui/StarRating';
import { formatPrice } from '@/lib/utils/price-utils';

interface ProductInfoProps {
  name: string;
  price: number;
  actualPrice?: number | null;
  averageRating?: number | null;
  totalReviews?: number | null;
}

export default function ProductInfo({ 
  name, 
  price, 
  actualPrice, 
  averageRating, 
  totalReviews 
}: ProductInfoProps) {
  const discount = actualPrice && actualPrice > price 
    ? Math.round(((actualPrice - price) / actualPrice) * 100) 
    : 0;

  return (
    <div>
      <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">{name}</h1>
      
      {averageRating && totalReviews && totalReviews > 0 && (
        <div className="mb-4">
          <CompactStarRating 
            rating={averageRating} 
            totalReviews={totalReviews}
            size="md"
          />
        </div>
      )}
      
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl md:text-4xl font-bold text-gray-900">
            {formatPrice(price)}
          </div>
          {actualPrice && actualPrice > price && (
            <>
              <div className="text-xl md:text-2xl text-gray-500 line-through">
                {formatPrice(actualPrice)}
              </div>
              <div className="bg-black text-white px-2 py-1 rounded-md text-sm font-medium">
                {discount}% OFF
              </div>
            </>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Inclusive of all taxes
          {actualPrice && actualPrice > price && (
            <span className="ml-2 text-gray-900 font-medium">
              You save ₹{(actualPrice - price).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
