/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

/**
 * Measure page load performance
 */
export function measurePagePerformance(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) {
    return null;
  }

  const metrics: PerformanceMetrics = {
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
  };

  // Get Web Vitals if available
  if ('PerformanceObserver' in window) {
    try {
      // First Contentful Paint
      const fcpEntries = performance.getEntriesByName('first-contentful-paint');
      if (fcpEntries.length > 0) {
        metrics.firstContentfulPaint = fcpEntries[0].startTime;
      }

      // Largest Contentful Paint
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
      }
    } catch (error) {
      console.warn('Error measuring Web Vitals:', error);
    }
  }

  return metrics;
}

/**
 * Monitor Core Web Vitals
 */
export class WebVitalsMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor(private onMetric?: (name: string, value: number) => void) {
    if (typeof window === 'undefined') return;
    
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
  }

  private observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.largestContentfulPaint = lastEntry.startTime;
        this.onMetric?.('LCP', lastEntry.startTime);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Error observing LCP:', error);
    }
  }

  private observeFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          this.onMetric?.('FID', entry.processingStart - entry.startTime);
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Error observing FID:', error);
    }
  }

  private observeCLS() {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = clsEntries[0];
            const lastSessionEntry = clsEntries[clsEntries.length - 1];

            if (!firstSessionEntry || 
                entry.startTime - lastSessionEntry.startTime < 1000 ||
                entry.startTime - firstSessionEntry.startTime < 5000) {
              clsEntries.push(entry);
              clsValue += entry.value;
            } else {
              clsEntries = [entry];
              clsValue = entry.value;
            }
          }
        });

        this.metrics.cumulativeLayoutShift = clsValue;
        this.onMetric?.('CLS', clsValue);
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Error observing CLS:', error);
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(resources: Array<{
  href: string;
  as: 'script' | 'style' | 'image' | 'font';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
}>) {
  if (typeof window === 'undefined') return;

  resources.forEach(({ href, as, type, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (type) link.type = type;
    if (crossorigin) link.crossOrigin = crossorigin;
    
    document.head.appendChild(link);
  });
}

/**
 * Lazy load non-critical resources
 */
export function lazyLoadResource(
  href: string,
  type: 'script' | 'style',
  onLoad?: () => void,
  onError?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is undefined'));
      return;
    }

    let element: HTMLScriptElement | HTMLLinkElement;

    if (type === 'script') {
      element = document.createElement('script');
      (element as HTMLScriptElement).src = href;
      (element as HTMLScriptElement).async = true;
    } else {
      element = document.createElement('link');
      (element as HTMLLinkElement).rel = 'stylesheet';
      (element as HTMLLinkElement).href = href;
    }

    element.onload = () => {
      onLoad?.();
      resolve();
    };

    element.onerror = () => {
      onError?.();
      reject(new Error(`Failed to load ${type}: ${href}`));
    };

    document.head.appendChild(element);
  });
}

/**
 * Optimize images for better performance
 */
export function optimizeImageLoading() {
  if (typeof window === 'undefined') return;

  // Add loading="lazy" to images that don't have it
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach((img) => {
    (img as HTMLImageElement).loading = 'lazy';
  });

  // Preload critical images (above the fold)
  const criticalImages = document.querySelectorAll('img[data-critical="true"]');
  criticalImages.forEach((img) => {
    const src = (img as HTMLImageElement).src;
    if (src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get connection information for adaptive loading
 */
export function getConnectionInfo(): {
  effectiveType: string;
  downlink: number;
  saveData: boolean;
} | null {
  if (typeof window === 'undefined' || !('navigator' in window)) return null;
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) return null;
  
  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    saveData: connection.saveData || false,
  };
}

/**
 * Adaptive loading based on connection
 */
export function shouldLoadHighQuality(): boolean {
  const connection = getConnectionInfo();
  
  if (!connection) return true; // Default to high quality if unknown
  
  // Don't load high quality on slow connections or when save data is enabled
  if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return false;
  }
  
  return true;
}