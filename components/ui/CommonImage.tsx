'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CommonImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export default function CommonImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  unoptimized = false,
  onLoad,
  onError
}: CommonImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Base classes following project's color scheme
  const baseClasses = `
    transition-all duration-300 ease-out
    ${isLoading ? 'bg-gray-100 animate-pulse' : ''}
    ${hasError ? 'bg-gray-200' : ''}
    ${className}
  `;

  // Error fallback
  if (hasError) {
    return (
      <div 
        className={`
          ${baseClasses}
          flex items-center justify-center
          bg-gradient-to-br from-gray-100 to-gray-200
          border border-gray-300
          ${fill ? 'absolute inset-0' : ''}
        `}
        style={!fill ? { width, height } : undefined}
      >
        <div className="text-center p-4">
          <svg 
            className="w-8 h-8 text-gray-400 mx-auto mb-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p className="text-xs text-gray-500 font-medium">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div 
          className={`
            absolute inset-0 z-10
            bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100
            animate-pulse
            flex items-center justify-center
            ${fill ? '' : 'rounded-lg'}
          `}
        >
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        loading={loading}
        unoptimized={unoptimized}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          ${baseClasses}
          ${objectFit === 'contain' ? 'object-contain' : ''}
          ${objectFit === 'cover' ? 'object-cover' : ''}
          ${objectFit === 'fill' ? 'object-fill' : ''}
          ${objectFit === 'none' ? 'object-none' : ''}
          ${objectFit === 'scale-down' ? 'object-scale-down' : ''}
          ${objectPosition === 'center' ? 'object-center' : ''}
          ${objectPosition === 'top' ? 'object-top' : ''}
          ${objectPosition === 'bottom' ? 'object-bottom' : ''}
          ${objectPosition === 'left' ? 'object-left' : ''}
          ${objectPosition === 'right' ? 'object-right' : ''}
          hover:scale-105 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50
        `}
        style={{
          objectPosition: objectPosition !== 'center' && 
                         objectPosition !== 'top' && 
                         objectPosition !== 'bottom' && 
                         objectPosition !== 'left' && 
                         objectPosition !== 'right' 
                         ? objectPosition : undefined
        }}
      />
    </div>
  );
}