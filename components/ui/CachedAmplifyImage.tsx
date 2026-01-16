'use client';

import React, { useState } from 'react';

interface CachedAmplifyImageProps {
  path: string | null | undefined; // Now accepts pre-resolved URL or path
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // Add priority for important images
}

/**
 * Simple image component that displays images from URLs
 * Note: Expects pre-resolved URLs from server-side actions
 */
export default function CachedAmplifyImage({
  path,
  alt,
  className = '',
  style,
  fallbackSrc = '/placeholder-product.svg',
  onLoad,
  onError,
  priority = false,
}: CachedAmplifyImageProps) {
  const [error, setError] = useState(false);
  
  // Use fallback if path is null/undefined or empty
  const imgSrc = path && path.trim() !== '' ? path : fallbackSrc;

  const handleImageLoad = () => {
    onLoad?.();
  };

  const handleImageError = () => {
    console.error('Image failed to load:', imgSrc);
    setError(true);
    onError?.();
  };

  return (
    <img
      src={error ? fallbackSrc : imgSrc}
      alt={alt}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}