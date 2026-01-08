'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getUrl } from 'aws-amplify/storage';

interface CachedAmplifyImageProps {
  path: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Simple cache to store URLs and prevent duplicate requests
const urlCache = new Map<string, string>();

export default function CachedAmplifyImage({
  path,
  alt,
  className = '',
  style,
  fallbackSrc = '/placeholder-product.svg',
  onLoad,
  onError,
}: CachedAmplifyImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Memoize the path to prevent unnecessary re-renders
  const memoizedPath = useMemo(() => path, [path]);

  useEffect(() => {
    let isMounted = true;

    const loadImageUrl = async () => {
      if (!memoizedPath) {
        setImageUrl(fallbackSrc);
        setLoading(false);
        return;
      }

      // Check cache first
      if (urlCache.has(memoizedPath)) {
        const cachedUrl = urlCache.get(memoizedPath)!;
        if (isMounted) {
          setImageUrl(cachedUrl);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        const result = await getUrl({ 
          path: memoizedPath,
          options: {
            expiresIn: 3600, // 1 hour
            validateObjectExistence: false, // Don't make HEAD request
          }
        });
        
        const url = result.url.toString();
        
        // Cache the URL
        urlCache.set(memoizedPath, url);
        
        if (isMounted) {
          setImageUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to get image URL:', err);
        if (isMounted) {
          setError(true);
          setImageUrl(fallbackSrc);
          setLoading(false);
        }
      }
    };

    loadImageUrl();

    return () => {
      isMounted = false;
    };
  }, [memoizedPath, fallbackSrc]);

  const handleImageLoad = () => {
    setError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setError(true);
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
      src={imageUrl || fallbackSrc}
      alt={alt}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}