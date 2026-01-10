'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/providers/cart-provider';
import { ProductCardImage } from '@/components/ui/OptimizedImage';
import { CompactStarRating } from '@/components/ui/StarRating';

interface QuickAddButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
  };
  isOutOfStock: boolean;
}

function QuickAddButton({ product, isOutOfStock }: QuickAddButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock || isAdding) return;
    
    setIsAdding(true);
    try {
      await addItem(product.id, 1, product.price);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isOutOfStock || isAdding}
      className={`touch-friendly p-2 rounded-full transition-all duration-200 ${
        isOutOfStock || isAdding
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 group-hover:scale-110 focus-ring'
      }`}
      title={isOutOfStock ? 'Out of stock' : isAdding ? 'Adding...' : 'Add to cart'}
      aria-label={isOutOfStock ? 'Out of stock' : isAdding ? 'Adding to cart...' : 'Add to cart'}
    >
      {isAdding ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
          />
        </svg>
      )}
    </button>
  );
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    isActive: boolean | null;
    availableQuantity?: number;
    averageRating?: number | null;
    totalReviews?: number | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleImageHover = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const isOutOfStock = product.availableQuantity !== undefined && product.availableQuantity <= 0;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <Link href={`/products/${product.id}`} className="focus-ring rounded-lg">
        {/* Product Image */}
        <div 
          className="relative aspect-square overflow-hidden bg-gray-100"
          onMouseEnter={handleImageHover}
          onMouseLeave={() => setCurrentImageIndex(0)}
        >
          {product.images.length > 0 ? (
            <ProductCardImage
              src={product.images[currentImageIndex] || product.images[0]}
              alt={product.name}
              className="group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <svg
                className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Image indicators for multiple images */}
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Stock Status Badge */}
          {isOutOfStock && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
            {product.name}
          </h3>
          
          <div 
            className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 product-description"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          {/* Rating */}
          {product.averageRating && product.totalReviews && (
            <div className="mb-2">
              <CompactStarRating 
                rating={product.averageRating} 
                totalReviews={product.totalReviews}
                size="sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {formatPrice(product.price)}
              </span>
              {product.availableQuantity !== undefined && (
                <span className={`text-xs ${
                  isOutOfStock 
                    ? 'text-red-600' 
                    : product.availableQuantity < 5 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                } truncate`}>
                  {isOutOfStock 
                    ? 'Out of stock' 
                    : product.availableQuantity < 5 
                      ? `Only ${product.availableQuantity} left` 
                      : 'In stock'
                  }
                </span>
              )}
            </div>

            {/* Quick Add to Cart Button */}
            <div className="ml-2 flex-shrink-0">
              <QuickAddButton 
                product={product}
                isOutOfStock={isOutOfStock}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}