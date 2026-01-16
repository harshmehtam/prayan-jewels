'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CachedAmplifyImage from '@/components/ui/CachedAmplifyImage';
import { CompactStarRating } from '@/components/ui/StarRating';
import { addToCart } from '@/app/actions/cart-actions';
import { addToWishlist, removeFromWishlist } from '@/app/actions/wishlist-actions';
import { formatPrice as formatPriceUtil } from '@/lib/utils/price-utils';
import type { Product } from '@/types';

interface ProductGridCardProps {
  product: Product;
  isInWishlist?: boolean; // Add prop for wishlist status
}

export default function ProductGridCard({ product, isInWishlist: initialIsInWishlist = false }: ProductGridCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const [isInWishlistState, setIsInWishlistState] = useState(initialIsInWishlist);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  // Update wishlist state when prop changes
  useEffect(() => {
    setIsInWishlistState(initialIsInWishlist);
  }, [initialIsInWishlist]);

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

  // Add to cart functionality using server action
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddToCartSuccess(false);
    setIsAddingToCart(true);
    
    try {
      const result = await addToCart(product.id, 1, product.price);
      
      if (result.success) {
        setAddToCartSuccess(true);
        setTimeout(() => {
          setAddToCartSuccess(false);
        }, 2000);
      } else {
        console.error('Failed to add to cart:', result.error);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Wishlist functionality
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTogglingWishlist(true);
    
    try {
      if (isInWishlistState) {
        const result = await removeFromWishlist(product.id);
        if (result.success) {
          setIsInWishlistState(false);
        }
      } else {
        const result = await addToWishlist(product.id);
        if (result.success) {
          setIsInWishlistState(true);
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
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
                <CachedAmplifyImage
                  path={product.images[isHovered && product.images.length > 1 ? 1 : 0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <CachedAmplifyImage
                        path={image}
                        alt={`${product.name} - Image ${imgIndex + 1}`}
                        className="w-full h-full object-cover"
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

          {/* Wishlist Heart Icon - Luxury jewelry style */}
          <button
            onClick={handleWishlistToggle}
            disabled={isTogglingWishlist}
            className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 group disabled:opacity-50"
            aria-label={isInWishlistState ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isTogglingWishlist ? (
              <svg className="w-4 h-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg 
                className={`w-4 h-4 transition-all duration-300 group-hover:scale-110 ${
                  isInWishlistState 
                    ? 'text-red-500 fill-red-500' 
                    : 'text-gray-600 hover:text-rose-500'
                }`}
                fill={isInWishlistState ? "currentColor" : "none"}
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
            )}
          </button>

          {/* Discount Badge */}
          {product.actualPrice && Number(product.actualPrice) > Number(product.price) && (
            <div className="absolute top-3 left-3 z-20 bg-black text-white text-base font-medium px-3 py-1.5 rounded shadow-lg">
              {Math.round(((Number(product.actualPrice) - Number(product.price)) / Number(product.actualPrice)) * 100)}% OFF
            </div>
          )}

          {/* Add to Cart Icon - Always visible */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-300 z-20 shadow-lg hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 group ${
              addToCartSuccess 
                ? 'bg-green-600 text-white' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            aria-label="Add to cart"
          >
              {isAddingToCart ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : addToCartSuccess ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>

          {/* Hover overlay for desktop - subtle luxury effect */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-lg" />
        </div>

        {/* Product Info */}
        <div className="space-y-1 p-3 pt-0">
          {/* Product Name */}
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Rating - Only show if product has reviews */}
          {product.averageRating && product.totalReviews && product.totalReviews > 0 && (
            <CompactStarRating 
              rating={product.averageRating} 
              totalReviews={product.totalReviews}
              size="sm"
            />
          )}

          {/* Material/Quality Badge */}
          <p className="text-base text-amber-600 font-medium">
            925 Silver
          </p>

          {/* Price */}
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold text-gray-900">
                {formatPriceUtil(product.price)}
              </p>
              {product.actualPrice && Number(product.actualPrice) > Number(product.price) && (
                <p className="text-base text-gray-500 line-through">
                  {formatPriceUtil(Number(product.actualPrice))}
                </p>
              )}
            </div>
            {product.actualPrice && Number(product.actualPrice) > Number(product.price) && (
              <p className="text-base text-gray-900 font-medium">
                Save ₹{(Number(product.actualPrice) - Number(product.price)).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}