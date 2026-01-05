'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/providers/cart-provider';

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem } = useCart();

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
    if (product.images.length <= 1) return;
    
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
    setIsHovered(true);
    if (product.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  // Add to cart functionality
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    
    try {
      await addItem(product.id, 1, product.price);
      // You could add a toast notification here
      console.log('Added to cart:', product.name);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // You could add error handling/toast here
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Link 
      href={`/products/${product.id}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
        {/* Product Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-lg mb-3">
          {product.images.length > 0 ? (
            <>
              {/* Desktop: Single image with hover effect */}
              <div className="hidden md:block absolute inset-0">
                <Image
                  src={product.images[isHovered && product.images.length > 1 ? 1 : 0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>

              {/* Mobile: Scrollable images with indicators */}
              <div className="md:hidden relative w-full h-full">
                <div 
                  className="flex w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                  onScroll={handleImageScroll}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {product.images.map((image, imgIndex) => (
                    <div key={imgIndex} className="w-full h-full flex-shrink-0 snap-center relative">
                      <Image
                        src={image}
                        alt={`${product.name} - Image ${imgIndex + 1}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
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
            </>
          ) : (
            /* Placeholder when no images */
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-lg">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
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

          {/* Wishlist Heart Icon - Luxury jewelry style */}
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              // For now, just console log - you can implement proper wishlist logic
              console.log('Toggle wishlist for product:', product.id);
            }}
            className={`absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 group ${
              isOutOfStock ? 'top-14' : ''
            }`}
            aria-label="Add to wishlist"
          >
            <svg 
              className="w-4 h-4 text-gray-600 hover:text-rose-500 transition-all duration-300 group-hover:scale-110" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>

          {/* Add to Cart Icon - Always visible with better icon */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="absolute bottom-2 right-2 p-2 bg-black text-white rounded-full transition-all duration-300 z-20 shadow-lg hover:bg-gray-800 hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 group"
              aria-label="Add to cart"
            >
              {isAddingToCart ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          )}

          {/* Hover overlay for desktop - subtle luxury effect */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-lg" />
        </div>

        {/* Product Info */}
        <div className="space-y-1 p-3 pt-0">
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
            <p className="text-xs text-amber-600 font-medium">
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