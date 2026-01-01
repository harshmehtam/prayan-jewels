'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  getOptimizedImageUrl, 
  getResponsiveSizes, 
  getPlaceholderImageUrl,
  IMAGE_CONFIGS,
  type ImageOptimizationOptions,
  type ResponsiveImageSizes 
} from '@/lib/utils/image-optimization';
import { useImageOptimization } from '@/lib/hooks/usePerformance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  config?: keyof typeof IMAGE_CONFIGS;
  customSizes?: Partial<ResponsiveImageSizes>;
  optimization?: ImageOptimizationOptions;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  quality,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  config,
  customSizes,
  optimization,
  ...props
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use performance optimization
  const {
    isSlowConnection,
    shouldUseHighQuality,
    getOptimalImageQuality,
    getOptimalImageFormat,
    shouldLazyLoad,
  } = useImageOptimization();

  // Get configuration from predefined configs or use custom optimization
  const imageConfig = config ? IMAGE_CONFIGS[config] : optimization;
  
  // Determine optimal quality based on connection
  const optimalQuality = quality || getOptimalImageQuality();
  const optimalFormat = getOptimalImageFormat();
  const shouldUseLazyLoading = shouldLazyLoad(priority);

  // Generate optimized image URL
  const optimizedSrc = getOptimizedImageUrl(src, {
    width: width || imageConfig?.width,
    height: height || imageConfig?.height,
    quality: shouldUseHighQuality ? optimalQuality : Math.min(optimalQuality, 70),
    format: imageConfig?.format || optimalFormat,
    fit: imageConfig?.fit || 'cover',
  });

  // Generate responsive sizes
  const responsiveSizes = sizes || getResponsiveSizes(customSizes);

  // Generate blur placeholder if not provided
  const placeholderDataURL = blurDataURL || (placeholder === 'blur' ? getPlaceholderImageUrl(src) : undefined);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Fallback image component for errors
  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 ${className}`}
        style={style}
      >
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
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <Image
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        loading={shouldUseLazyLoading ? loading : 'eager'}
        quality={optimalQuality}
        placeholder={placeholder}
        blurDataURL={placeholderDataURL}
        sizes={responsiveSizes}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${fill ? 'object-cover' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {isSlowConnection ? (
            // Simple loading indicator for slow connections
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
          ) : (
            // Spinner for faster connections
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          )}
        </div>
      )}
      
      {/* Connection indicator for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && isSlowConnection && (
        <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
          Slow
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function ProductCardImage({ src, alt, className, ...props }: Omit<OptimizedImageProps, 'config'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      config="productCard"
      className={className}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      {...props}
    />
  );
}

export function ProductDetailImage({ src, alt, className, ...props }: Omit<OptimizedImageProps, 'config'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      config="productDetail"
      className={className}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px"
      priority
      {...props}
    />
  );
}

export function ProductThumbnailImage({ src, alt, className, ...props }: Omit<OptimizedImageProps, 'config'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      config="productThumbnail"
      className={className}
      width={150}
      height={150}
      sizes="150px"
      {...props}
    />
  );
}

export function HeroImage({ src, alt, className, ...props }: Omit<OptimizedImageProps, 'config'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      config="hero"
      className={className}
      fill
      sizes="100vw"
      priority
      {...props}
    />
  );
}