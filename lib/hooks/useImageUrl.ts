import { useState, useEffect, useCallback } from 'react';
import { ImageService } from '@/lib/services/image-service';

interface UseImageUrlOptions {
  fallbackUrl?: string;
  preload?: boolean;
}

interface UseImageUrlReturn {
  url: string | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Hook for loading image URLs from S3
 */
export function useImageUrl(path: string | null, options: UseImageUrlOptions = {}): UseImageUrlReturn {
  const { fallbackUrl = '/placeholder-product.svg', preload = false } = options;
  
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback(async () => {
    if (!path) {
      setUrl(fallbackUrl);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageUrl = await ImageService.getImageUrl(path);
      setUrl(imageUrl);
      
      // Preload the image if requested
      if (preload) {
        const img = new Image();
        img.src = imageUrl;
      }
    } catch (err) {
      console.error(`Failed to load image ${path}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setUrl(fallbackUrl);
    } finally {
      setLoading(false);
    }
  }, [path, fallbackUrl, preload]);

  const retry = useCallback(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return { url, loading, error, retry };
}

/**
 * Hook for loading multiple image URLs
 */
export function useImageUrls(paths: string[]): {
  urls: { [path: string]: string };
  loading: boolean;
  error: string | null;
  retry: () => void;
} {
  const [urls, setUrls] = useState<{ [path: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (paths.length === 0) {
      setUrls({});
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageUrls = await ImageService.getImageUrls(paths);
      setUrls(imageUrls);
    } catch (err) {
      console.error('Failed to load images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [paths]);

  const retry = useCallback(() => {
    loadImages();
  }, [loadImages]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  return { urls, loading, error, retry };
}