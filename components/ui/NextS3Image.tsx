'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useImageUrl } from '@/lib/hooks/useImageUrl';

interface NextS3ImageProps {
  path: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackUrl?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export default function NextS3Image({
  path,
  alt,
  width,
  height,
  className = '',
  fallbackUrl = '/placeholder-product.svg',
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
}: NextS3ImageProps) {
  const [imageError, setImageError] = useState(false);

  // Determine if this is an S3 path or a local path
  const isS3Path = path && (path.startsWith('product-images/') || path.includes('s3.'));
  const isLocalPath = path && path.startsWith('/images/');
  
  // For S3 paths, use the hook to get the proxy URL
  const { url: s3Url, loading, error, retry } = useImageUrl(
    isS3Path ? path : null, 
    { fallbackUrl }
  );

  // Determine the final URL to use
  let finalUrl: string;
  if (isS3Path) {
    finalUrl = s3Url || fallbackUrl;
  } else if (isLocalPath) {
    finalUrl = path;
  } else {
    finalUrl = path || fallbackUrl;
  }

  const handleImageLoad = () => {
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.(error || 'Image failed to load');
  };

  const handleRetry = () => {
    setImageError(false);
    if (isS3Path) {
      retry();
    }
  };

  // Loading state (only for S3 images)
  if (isS3Path && loading) {
    return (
      <div 
        className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  // Error state
  if (imageError && !loading) {
    return (
      <div 
        className={`bg-gray-100 flex flex-col items-center justify-center p-4 ${className}`}
        style={{ width, height, ...style }}
      >
        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <button
          onClick={handleRetry}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Use Next.js Image component for optimal performance
  if (fill) {
    return (
      <Image
        src={finalUrl}
        alt={alt}
        fill
        className={className}
        style={style}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  }

  return (
    <Image
      src={finalUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      priority={priority}
      quality={quality}
      sizes={sizes}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}

// Product image variants with optimized sizes
export function ProductCardImage({ path, alt, className = '' }: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <NextS3Image
      path={path}
      alt={alt}
      width={300}
      height={300}
      className={className}
      sizes="(max-width: 768px) 150px, (max-width: 1200px) 250px, 300px"
      quality={85}
    />
  );
}

export function ProductThumbnailImage({ path, alt, className = '' }: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <NextS3Image
      path={path}
      alt={alt}
      width={80}
      height={80}
      className={className}
      sizes="80px"
      quality={80}
    />
  );
}

export function ProductDetailImage({ path, alt, className = '', priority = false }: {
  path: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <NextS3Image
      path={path}
      alt={alt}
      width={600}
      height={600}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
      quality={90}
      priority={priority}
    />
  );
}

export function ProductHeroImage({ path, alt, className = '' }: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <NextS3Image
        path={path}
        alt={alt}
        width={1200}
        height={800}
        className="w-full h-auto"
        sizes="100vw"
        quality={95}
        priority={true}
      />
    </div>
  );
}