/**
 * Image utility functions for optimization and validation
 */

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Validate image file before upload (WebP enforced)
 */
export function validateImageFile(file: File): ImageValidationResult {
  const result: ImageValidationResult = { isValid: true, warnings: [] };

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }

  // Check file size (5MB limit for better performance)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image must be smaller than 5MB' };
  }

  // Warn about non-optimal formats (will be converted to WebP anyway)
  const optimalFormats = ['image/webp'];
  if (!optimalFormats.includes(file.type)) {
    result.warnings?.push('Image will be converted to WebP format for optimal performance');
  }

  // Check for large file sizes
  const warningSize = 1 * 1024 * 1024; // 1MB
  if (file.size > warningSize) {
    result.warnings?.push('Large file size will be compressed during upload');
  }

  return result;
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resize image file (client-side)
 */
export function resizeImage(
  file: File, 
  options: ImageOptimizationOptions
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = URL.createObjectURL(file);

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width: originalWidth, height: originalHeight } = img;
      const { maxWidth = originalWidth, maxHeight = originalHeight, quality = 0.9, format = 'jpeg' } = options;

      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          const optimizedFile = new File([blob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now(),
          });

          resolve(optimizedFile);
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Generate thumbnail from image file
 */
export function generateThumbnail(file: File, size: number = 150): Promise<File> {
  return resizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    format: 'jpeg',
  });
}

/**
 * Batch validate multiple image files
 */
export function validateImageFiles(files: File[]): {
  valid: File[];
  invalid: { file: File; error: string }[];
  warnings: { file: File; warnings: string[] }[];
} {
  const valid: File[] = [];
  const invalid: { file: File; error: string }[] = [];
  const warnings: { file: File; warnings: string[] }[] = [];

  files.forEach(file => {
    const validation = validateImageFile(file);
    
    if (validation.isValid) {
      valid.push(file);
      
      if (validation.warnings && validation.warnings.length > 0) {
        warnings.push({ file, warnings: validation.warnings });
      }
    } else {
      invalid.push({ file, error: validation.error || 'Invalid file' });
    }
  });

  return { valid, invalid, warnings };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Generate optimized filename for storage
 */
export function generateOptimizedFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = getFileExtension(originalName);
  
  const baseName = prefix ? `${prefix}-${timestamp}-${randomId}` : `${timestamp}-${randomId}`;
  return `${baseName}.${extension}`;
}