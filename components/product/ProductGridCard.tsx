'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string | null;
  isActive: boolean | null;
  availableQuantity?: number;
  averageRating?: number | null;
  totalReviews?: number | null;
}

interface ProductGridCardProps {
  product: Product;
  index: number;
}

export default function ProductGridCard({ product, index }: ProductGridCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-3 h-3 text-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-${product.id}-${i}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#half-${product.id}-${i})`}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-3 h-3 text-gray-300" viewBox="0 0 20 20">
            <path
              fill="currentColor"
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        );
      }
    }
    return stars;
  };

  const getBadgeText = (product: Product, index: number) => {
    // Add badges similar to the jewelry image
    if (index === 1) return "Bestseller";
    if (index === 3) return "Reserve Now";
    if (product.category === 'designer') return "Designer";
    if (product.averageRating && product.averageRating >= 4.5) return "Top Rated";
    if (product.availableQuantity && product.availableQuantity < 5) return "Limited";
    return null;
  };

  const badge = getBadgeText(product, index);
  const isOutOfStock = product.availableQuantity !== undefined && product.availableQuantity <= 0;

  // Handle image scroll for mobile
  const handleImageScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isMobile || product.images.length <= 1) return;
    
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const imageWidth = container.offsetWidth;
    const newIndex = Math.round(scrollLeft / imageWidth);
    
    if (newIndex !== currentImageIndex && newIndex >= 0 && newIndex < product.images.length) {
      setCurrentImageIndex(newIndex);
    }
  };

  // Desktop hover behavior
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      if (product.images.length > 1) {
        setCurrentImageIndex(1);
      }
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setCurrentImageIndex(0);
    }
  };

  return (
    <Link 
      href={`/products/${product.id}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative bg-white">
        {/* Product Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg mb-3">
          {product.images.length > 0 ? (
            <>
              {/* Desktop: Single image with hover effect - Same placeholder as mobile */}
              {!isMobile ? (
                <div className="w-full h-full relative bg-gray-100">
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-amber-200 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-600 font-medium px-2 leading-tight">
                        {isHovered && product.images.length > 1 ? 
                          `${product.name.substring(0, 15)}... (2)` : 
                          product.name.substring(0, 20)
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile: Scrollable images with indicators - ORIGINAL functionality */
                <div className="relative w-full h-full bg-gray-100">
                  <div 
                    className="flex w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                    onScroll={handleImageScroll}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {product.images.map((image, imgIndex) => (
                      <div key={imgIndex} className="w-full h-full flex-shrink-0 snap-center bg-gray-100">
                        {/* Original mobile placeholder */}
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-1 bg-amber-200 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                            </div>
                            <p className="text-xs text-gray-600 px-1">{product.name.substring(0, 15)}...</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mobile Image Indicators */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {product.images.map((_, imgIndex) => (
                        <div
                          key={imgIndex}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            imgIndex === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Placeholder when no images */
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg
                className="w-8 h-8 text-gray-400"
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

          {/* Badge */}
          {badge && (
            <div className="absolute top-2 left-2 bg-black text-white text-xs font-medium px-2 py-1 rounded-sm z-10">
              {badge}
            </div>
          )}

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-sm z-10">
              Sold Out
            </div>
          )}

          {/* Hover overlay for desktop */}
          {!isMobile && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 rounded-lg" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          {/* Product Name */}
          <h3 className="text-sm font-normal text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Rating */}
          {product.averageRating && product.totalReviews && (
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                {renderStars(product.averageRating)}
              </div>
              <span className="text-xs text-gray-500">
                {product.averageRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Category/Material */}
          {product.category && (
            <p className="text-xs text-gray-500">
              18k Gold Vermeil
            </p>
          )}

          {/* Price */}
          <p className="text-sm font-semibold text-gray-900 pt-1">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}