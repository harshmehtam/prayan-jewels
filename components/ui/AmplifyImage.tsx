'use client';

import React from 'react';
import { StorageImage } from '@aws-amplify/ui-react-storage';

interface AmplifyImageProps {
  path: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function AmplifyImage({
  path,
  alt,
  className = '',
  fallbackSrc = '/placeholder-product.svg',
  onLoad,
  onError,
}: AmplifyImageProps) {
  // If no path, show fallback
  if (!path) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  // Use Amplify's StorageImage component - it handles everything automatically
  return (
    <StorageImage
      alt={alt}
      path={path}
      className={className}
      fallbackSrc={fallbackSrc}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

// Product-specific variants
export function ProductCardImage({ path, alt, className = '' }: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <AmplifyImage
      path={path}
      alt={alt}
      className={`w-full h-48 object-cover ${className}`}
    />
  );
}

export function ProductThumbnailImage({ path, alt, className = '' }: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <AmplifyImage
      path={path}
      alt={alt}
      className={`w-12 h-12 object-cover rounded ${className}`}
    />
  );
}

export function ProductDetailImage({ path, alt, className = '' }: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <AmplifyImage
      path={path}
      alt={alt}
      className={`w-full h-auto object-cover ${className}`}
    />
  );
}