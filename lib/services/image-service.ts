import { uploadData, getUrl, remove, list } from 'aws-amplify/storage';

/**
 * Convert image to WebP format with compression
 */
async function convertToWebP(file: File, quality: number = 0.8): Promise<File> {
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

      // Calculate optimal dimensions (max 1200px width for products)
      const maxWidth = 1200;
      const maxHeight = 1200;
      
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

      // Draw image with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert to WebP'));
            return;
          }

          // Generate WebP filename
          const originalName = file.name.split('.')[0];
          const webpFile = new File([blob], `${originalName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          console.log(`✅ Converted ${file.name} to WebP: ${(file.size / 1024).toFixed(1)}KB → ${(webpFile.size / 1024).toFixed(1)}KB`);
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for WebP conversion'));
    };

    img.src = url;
  });
}

export class ImageService {
  /**
   * Upload image to S3 with WebP conversion and optimization
   */
  static async uploadImage(file: File, folder: string = 'product-images'): Promise<string> {
    try {
      console.log(`📤 Processing image: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

      // Convert to WebP format with compression
      const webpFile = await convertToWebP(file, 0.85); // 85% quality for good balance

      // Generate optimized filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${folder}/${timestamp}-${randomId}.webp`;

      console.log(`📤 Uploading WebP image: ${fileName} (${(webpFile.size / 1024).toFixed(1)}KB)`);

      // Upload to S3
      const result = await uploadData({
        path: fileName,
        data: webpFile,
        options: {
          contentType: 'image/webp',
          metadata: {
            originalName: file.name,
            originalSize: file.size.toString(),
            compressedSize: webpFile.size.toString(),
            uploadedAt: new Date().toISOString(),
            format: 'webp',
          },
        },
      }).result;

      console.log(`✅ Upload successful: ${result.path}`);
      return result.path;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple images with progress tracking
   */
  static async uploadImages(
    files: File[], 
    folder: string = 'product-images',
    onProgress?: (progress: { completed: number; total: number; currentFile: string }) => void
  ): Promise<string[]> {
    const uploadedPaths: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress({
          completed: i,
          total: files.length,
          currentFile: file.name,
        });
      }

      try {
        const path = await this.uploadImage(file, folder);
        uploadedPaths.push(path);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    }

    if (onProgress) {
      onProgress({
        completed: files.length,
        total: files.length,
        currentFile: '',
      });
    }

    return uploadedPaths;
  }

  /**
   * Get image URL using proxy endpoint
   */
  static async getImageUrl(path: string): Promise<string> {
    try {
      console.log(`📥 Generating proxy URL for: ${path}`);

      // Use our image proxy API to avoid long S3 URLs
      const proxyUrl = `/api/image?path=${encodeURIComponent(path)}`;
      
      console.log(`✅ Proxy URL generated: ${path}`);
      return proxyUrl;
    } catch (error) {
      console.error(`❌ Failed to get URL for ${path}:`, error);
      throw new Error(`Failed to get image URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get multiple image URLs with batch optimization
   */
  static async getImageUrls(paths: string[]): Promise<{ [path: string]: string }> {
    const urls: { [path: string]: string } = {};
    
    // Generate proxy URLs for all paths
    for (const path of paths) {
      try {
        const url = await this.getImageUrl(path);
        urls[path] = url;
      } catch (error) {
        console.error(`Failed to get URL for ${path}:`, error);
        urls[path] = '';
      }
    }

    return urls;
  }

  /**
   * Delete image from S3
   */
  static async deleteImage(path: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting image: ${path}`);
      
      await remove({ path });
      
      console.log(`✅ Image deleted: ${path}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${path}:`, error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple images
   */
  static async deleteImages(paths: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const path of paths) {
      try {
        await this.deleteImage(path);
        success.push(path);
      } catch (error) {
        console.error(`Failed to delete ${path}:`, error);
        failed.push(path);
      }
    }

    return { success, failed };
  }

  /**
   * List images in a folder
   */
  static async listImages(folder: string = 'product-images'): Promise<string[]> {
    try {
      console.log(`📋 Listing images in: ${folder}`);
      
      const result = await list({
        path: `${folder}/`,
      });

      const paths = result.items.map(item => item.path);
      console.log(`✅ Found ${paths.length} images in ${folder}`);
      
      return paths;
    } catch (error) {
      console.error(`❌ Failed to list images in ${folder}:`, error);
      throw new Error(`Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimized image URL with size and format options
   */
  static async getOptimizedImageUrl(
    path: string, 
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    }
  ): Promise<string> {
    // Get the proxy URL
    const url = await this.getImageUrl(path);
    
    // Add query parameters for image optimization services
    if (options && Object.keys(options).length > 0) {
      const params = new URLSearchParams();
      if (options.width) params.set('w', options.width.toString());
      if (options.height) params.set('h', options.height.toString());
      if (options.quality) params.set('q', options.quality.toString());
      if (options.format) params.set('f', options.format);
      
      return `${url}&${params.toString()}`;
    }
    
    return url;
  }

  /**
   * Preload images for better performance
   */
  static async preloadImages(paths: string[]): Promise<void> {
    console.log(`🚀 Preloading ${paths.length} images...`);
    
    // Get proxy URLs
    await this.getImageUrls(paths);
    
    // Preload in browser using the proxy URLs
    const preloadPromises = paths.map(async (path) => {
      try {
        const url = await this.getImageUrl(path);
        const img = new Image();
        img.src = url;
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't fail on individual image errors
        });
      } catch (error) {
        console.warn(`Failed to preload ${path}:`, error);
      }
    });

    await Promise.all(preloadPromises);
    console.log(`✅ Preloaded ${paths.length} images`);
  }
}