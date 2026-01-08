import { uploadData, getUrl, remove } from 'aws-amplify/storage';

export class SimpleImageService {
  /**
   * Upload image to Amplify Storage - SIMPLE VERSION
   */
  static async uploadImage(file: File, folder: string = 'product-images'): Promise<string> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${timestamp}-${randomId}.${extension}`;

    const result = await uploadData({
      path,
      data: file,
      options: {
        contentType: file.type,
      },
    }).result;

    return result.path;
  }

  /**
   * Upload multiple images
   */
  static async uploadImages(
    files: File[], 
    folder: string = 'product-images',
    onProgress?: (progress: { completed: number; total: number; currentFile: string }) => void
  ): Promise<string[]> {
    const uploadedPaths: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      onProgress?.({
        completed: i,
        total: files.length,
        currentFile: file.name,
      });

      const path = await this.uploadImage(file, folder);
      uploadedPaths.push(path);
    }

    onProgress?.({
      completed: files.length,
      total: files.length,
      currentFile: '',
    });

    return uploadedPaths;
  }

  /**
   * Get signed URL for image - SIMPLE VERSION
   */
  static async getImageUrl(path: string): Promise<string> {
    const result = await getUrl({ path });
    return result.url.toString();
  }

  /**
   * Delete image from Amplify Storage
   */
  static async deleteImage(path: string): Promise<void> {
    await remove({ path });
  }

  /**
   * Delete multiple images
   */
  static async deleteImages(paths: string[]): Promise<void> {
    await Promise.all(paths.map(path => this.deleteImage(path)));
  }
}