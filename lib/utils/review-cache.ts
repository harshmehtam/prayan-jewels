// Review cache utility to optimize performance when fetching multiple product ratings
import { ReviewService } from '@/lib/services/review-service';
import type { ReviewStats } from '@/types';

// Cache for review stats to avoid duplicate API calls
const reviewStatsCache = new Map<string, { stats: ReviewStats; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ReviewCache {
  /**
   * Get review stats with caching
   */
  static async getProductReviewStats(productId: string): Promise<ReviewStats> {
    const now = Date.now();
    const cached = reviewStatsCache.get(productId);
    
    // Return cached data if it's still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.stats;
    }
    
    try {
      // Fetch fresh data
      const { stats } = await ReviewService.getProductReviews(productId);
      
      // Cache the result
      reviewStatsCache.set(productId, {
        stats,
        timestamp: now
      });
      
      return stats;
    } catch (error) {
      console.error(`Error fetching review stats for product ${productId}:`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        return cached.stats;
      }
      
      // Return empty stats as fallback
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }

  /**
   * Batch fetch review stats for multiple products
   */
  static async batchGetProductReviewStats(productIds: string[]): Promise<Map<string, ReviewStats>> {
    const results = new Map<string, ReviewStats>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (productId) => {
        const stats = await this.getProductReviewStats(productId);
        return { productId, stats };
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ productId, stats }) => {
        results.set(productId, stats);
      });
    }
    
    return results;
  }

  /**
   * Clear cache for a specific product (useful after new reviews)
   */
  static clearProductCache(productId: string): void {
    reviewStatsCache.delete(productId);
  }

  /**
   * Clear all cached data
   */
  static clearAllCache(): void {
    reviewStatsCache.clear();
  }

  /**
   * Get cache size (for debugging)
   */
  static getCacheSize(): number {
    return reviewStatsCache.size;
  }
}