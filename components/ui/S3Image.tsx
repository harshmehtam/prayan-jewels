'use client';

import React, { useState } from 'react';
import { useImageUrl } from '@/lib/hooks/useImageUrl';

interface S3ImageProps {
  path: string | null;
  alt: string;
  className?: string;
  fallbackUrl?: string;
  showLoading?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  // Standard img props
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export default function S3Image({
  path,
  alt,
  className = '',
  fallbackUrl = '/placeholder-product.svg',
  showLoading = true,
  onLoad,
  onError,
  ...imgProps
}: S3ImageProps) {
  const { url, loading, error, retry } = useImageUrl(path, { fallbackUrl });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    onError?.(error || 'Image failed to load');
  };

  const handleRetry = () => {
    setImageError(false);
    setImageLoaded(false);
    retry();
  };

  if (loading && showLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`} {...imgProps}>
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (imageError && !loading) {
    return (
      <div className={`bg-gray-100 flex flex-col items-center justify-center p-4 ${className}`} {...imgProps}>
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

  return (
    <img
      src={url || fallbackUrl}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      {...imgProps}
    />
  );
}

// Optimized image component with size options
interface OptimizedS3ImageProps extends S3ImageProps {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export function OptimizedS3Image({
  path,
  width,
  height,
  quality,
  format,
  ...props
}: OptimizedS3ImageProps) {
  // For now, just use the regular S3Image
  // In production, you'd implement image optimization here
  return <S3Image path={path} {...props} width={width} height={height} />;
}

// Preloaded image component for better performance
export function PreloadedS3Image({ path, ...props }: S3ImageProps) {
  const { url } = useImageUrl(path, { preload: true });
  
  return <S3Image path={path} {...props} />;
}