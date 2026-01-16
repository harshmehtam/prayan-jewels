'use client';

import React, { useState } from 'react';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  style,
  fallbackSrc = '/placeholder-product.svg',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
    setImgSrc(fallbackSrc);
    onError?.();
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 animate-pulse flex items-center justify-center ${className}`}>
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}
