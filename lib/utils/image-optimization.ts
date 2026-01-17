/**
 * Image optimization utilities for the ecommerce platform
 * Handles image transformations, lazy loading, and CDN optimization
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  placeholder?: boolean;
}

export interface ResponsiveImageSizes {
  mobile: number;
  tablet: number;
  desktop: number;
  xl: number;
}

/**
 * Default responsive breakpoints for product images
 */
export const DEFAULT_RESPONSIVE_SIZES: ResponsiveImageSizes = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  xl: 1440,
};

/**
 * Generate optimized image URL with transformations
 * Currently supports Unsplash URLs and will be extended for S3 CDN
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover',
  } = options;

  // Handle Unsplash URLs
  if (originalUrl.includes('unsplash.com')) {
    const url = new URL(originalUrl);
    
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality !== 80) url.searchParams.set('q', quality.toString());
    if (fit !== 'cover') url.searchParams.set('fit', fit);
    if (format === 'webp') url.searchParams.set('fm', 'webp');
    
    return url.toString();
  }

  // Handle S3 URLs (when CloudFront is set up)
  if (originalUrl.includes('amazonaws.com') || originalUrl.includes('cloudfront.net')) {
    // For now, return original URL
    // TODO: Implement CloudFront image transformations
    return originalUrl;
  }

  return originalUrl;
}

/**
 * Generate responsive image sizes string for Next.js Image component
 */
export function getResponsiveSizes(
  sizes: Partial<ResponsiveImageSizes> = {}
): string {
  const finalSizes = { ...DEFAULT_RESPONSIVE_SIZES, ...sizes };
  
  return [
    `(max-width: 640px) ${finalSizes.mobile}px`,
    `(max-width: 768px) ${finalSizes.tablet}px`,
    `(max-width: 1024px) ${finalSizes.desktop}px`,
    `${finalSizes.xl}px`
  ].join(', ');
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  originalUrl: string,
  sizes: Partial<ResponsiveImageSizes> = {}
): string {
  const finalSizes = { ...DEFAULT_RESPONSIVE_SIZES, ...sizes };
  
  const srcSetEntries = Object.entries(finalSizes).map(([, width]) => {
    const optimizedUrl = getOptimizedImageUrl(originalUrl, { width });
    return `${optimizedUrl} ${width}w`;
  });
  
  return srcSetEntries.join(', ');
}

/**
 * Generate placeholder image URL for lazy loading
 */
export function getPlaceholderImageUrl(
  originalUrl: string,
  width: number = 20,
  height: number = 20
): string {
  return getOptimizedImageUrl(originalUrl, {
    width,
    height,
    quality: 10,
    blur: 10,
    placeholder: true
  });
}

/**
 * Check if image format is supported by the browser
 */
export function isFormatSupported(format: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
  } catch {
    return false;
  }
}

/**
 * Get the best supported image format for the browser
 */
export function getBestImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'webp';
  
  if (isFormatSupported('avif')) return 'avif';
  if (isFormatSupported('webp')) return 'webp';
  return 'jpeg';
}

/**
 * Preload critical images for better performance
 */
export function preloadImage(src: string, sizes?: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  
  if (sizes) {
    link.setAttribute('imagesizes', sizes);
  }
  
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined') return;
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
        this.images.delete(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcSet = img.dataset.srcset;
    
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
    
    if (srcSet) {
      img.srcset = srcSet;
      img.removeAttribute('data-srcset');
    }
    
    img.classList.remove('lazy');
    img.classList.add('loaded');
  }

  observe(img: HTMLImageElement) {
    if (!this.observer) return;
    
    this.images.add(img);
    this.observer.observe(img);
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

/**
 * Image optimization configuration for different contexts
 */
export const IMAGE_CONFIGS = {
  productCard: {
    width: 400,
    height: 400,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  productDetail: {
    width: 800,
    height: 800,
    quality: 90,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  productThumbnail: {
    width: 150,
    height: 150,
    quality: 80,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  hero: {
    width: 1920,
    height: 1080,
    quality: 85,
    format: 'webp' as const,
    fit: 'cover' as const,
  },
  placeholder: {
    width: 20,
    height: 20,
    quality: 10,
    format: 'webp' as const,
    fit: 'cover' as const,
    blur: 10,
  },
} as const;