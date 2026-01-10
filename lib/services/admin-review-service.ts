// Admin review service for managing and moderating reviews
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { ProductReview, ReviewFilters } from '@/types';

const client = generateClient<Schema>();

export class AdminReviewService {
  /**
   * Get all reviews for admin management (including unapproved)
   */
  static async getAllReviews(filters: ReviewFilters & { 
    isApproved?: boolean;
    limit?: number;
    nextToken?: string;
  } = {}): Promise<{
    reviews: ProductReview[];
    nextToken?: string;
    errors?: string[];
  }> {
    try {
      const filterConditions: any[] = [];

      // Add filters
      if (filters.productId) {
        filterConditions.push({ productId: { eq: filters.productId } });
      }

      if (filters.customerId) {
        filterConditions.push({ customerId: { eq: filters.customerId } });
      }

      if (filters.rating) {
        filterConditions.push({ rating: { eq: filters.rating } });
      }

      if (filters.isApproved !== undefined) {
        filterConditions.push({ isApproved: { eq: filters.isApproved } });
      }

      const result = await client.models.ProductReview.list({
        filter: filterConditions.length > 0 ? { and: filterConditions } : undefined,
        limit: filters.limit || 50,
        nextToken: filters.nextToken
      });

      if (result.errors) {
        return { reviews: [], errors: result.errors.map(e => e.message) };
      }

      let reviews = result.data || [];

      // Sort reviews
      switch (filters.sortBy) {
        case 'oldest':
          reviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'rating-high':
          reviews.sort((a, b) => b.rating - a.rating);
          break;
        case 'rating-low':
          reviews.sort((a, b) => a.rating - b.rating);
          break;
        case 'helpful':
          reviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
          break;
        case 'newest':
        default:
          reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }

      return { 
        reviews: reviews as ProductReview[],
        nextToken: result.nextToken || undefined
      };

    } catch (error) {
      console.error('Error getting all reviews:', error);
      return { 
        reviews: [], 
        errors: [error instanceof Error ? error.message : 'Failed to get reviews'] 
      };
    }
  }

  /**
   * Approve a review
   */
  static async approveReview(adminId: string, reviewId: string, adminNotes?: string): Promise<{
    review?: ProductReview;
    errors?: string[];
  }> {
    try {
      const result = await client.models.ProductReview.update({
        id: reviewId,
        isApproved: true,
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        adminNotes: adminNotes || undefined
      });

      if (result.errors) {
        return { errors: result.errors.map(e => e.message) };
      }

      return { review: result.data as ProductReview };

    } catch (error) {
      console.error('Error approving review:', error);
      return { errors: [error instanceof Error ? error.message : 'Failed to approve review'] };
    }
  }

  /**
   * Reject/Unapprove a review
   */
  static async rejectReview(adminId: string, reviewId: string, adminNotes?: string): Promise<{
    review?: ProductReview;
    errors?: string[];
  }> {
    try {
      const result = await client.models.ProductReview.update({
        id: reviewId,
        isApproved: false,
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        adminNotes: adminNotes || undefined
      });

      if (result.errors) {
        return { errors: result.errors.map(e => e.message) };
      }

      return { review: result.data as ProductReview };

    } catch (error) {
      console.error('Error rejecting review:', error);
      return { errors: [error instanceof Error ? error.message : 'Failed to reject review'] };
    }
  }

  /**
   * Delete a review (admin only)
   */
  static async deleteReview(reviewId: string): Promise<{
    success: boolean;
    errors?: string[];
  }> {
    try {
      const result = await client.models.ProductReview.delete({ id: reviewId });

      if (result.errors) {
        return { success: false, errors: result.errors.map(e => e.message) };
      }

      return { success: true };

    } catch (error) {
      console.error('Error deleting review:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Failed to delete review'] };
    }
  }

  /**
   * Bulk approve reviews
   */
  static async bulkApproveReviews(adminId: string, reviewIds: string[]): Promise<{
    successCount: number;
    errors?: string[];
  }> {
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const reviewId of reviewIds) {
        try {
          const result = await this.approveReview(adminId, reviewId);
          if (result.errors) {
            errors.push(`Review ${reviewId}: ${result.errors.join(', ')}`);
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`Review ${reviewId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { successCount, errors: errors.length > 0 ? errors : undefined };

    } catch (error) {
      console.error('Error bulk approving reviews:', error);
      return { 
        successCount: 0, 
        errors: [error instanceof Error ? error.message : 'Failed to bulk approve reviews'] 
      };
    }
  }

  /**
   * Bulk reject reviews
   */
  static async bulkRejectReviews(adminId: string, reviewIds: string[]): Promise<{
    successCount: number;
    errors?: string[];
  }> {
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const reviewId of reviewIds) {
        try {
          const result = await this.rejectReview(adminId, reviewId);
          if (result.errors) {
            errors.push(`Review ${reviewId}: ${result.errors.join(', ')}`);
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`Review ${reviewId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { successCount, errors: errors.length > 0 ? errors : undefined };

    } catch (error) {
      console.error('Error bulk rejecting reviews:', error);
      return { 
        successCount: 0, 
        errors: [error instanceof Error ? error.message : 'Failed to bulk reject reviews'] 
      };
    }
  }

  /**
   * Get pending reviews count
   */
  static async getPendingReviewsCount(): Promise<{
    count: number;
    errors?: string[];
  }> {
    try {
      const result = await client.models.ProductReview.list({
        filter: { isApproved: { eq: false } }
      });

      if (result.errors) {
        return { count: 0, errors: result.errors.map(e => e.message) };
      }

      return { count: result.data?.length || 0 };

    } catch (error) {
      console.error('Error getting pending reviews count:', error);
      return { 
        count: 0, 
        errors: [error instanceof Error ? error.message : 'Failed to get pending reviews count'] 
      };
    }
  }

  /**
   * Get review statistics for admin dashboard
   */
  static async getReviewStatistics(): Promise<{
    stats: {
      totalReviews: number;
      approvedReviews: number;
      pendingReviews: number;
      averageRating: number;
      reviewsThisMonth: number;
    };
    errors?: string[];
  }> {
    try {
      // Get all reviews
      const allReviewsResult = await client.models.ProductReview.list();

      if (allReviewsResult.errors) {
        return { 
          stats: { totalReviews: 0, approvedReviews: 0, pendingReviews: 0, averageRating: 0, reviewsThisMonth: 0 },
          errors: allReviewsResult.errors.map(e => e.message) 
        };
      }

      const allReviews = allReviewsResult.data || [];
      const approvedReviews = allReviews.filter(r => r.isApproved);
      const pendingReviews = allReviews.filter(r => !r.isApproved);

      // Calculate average rating from approved reviews
      const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;

      // Count reviews from this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const reviewsThisMonth = allReviews.filter(review => 
        new Date(review.createdAt) >= thisMonth
      ).length;

      return {
        stats: {
          totalReviews: allReviews.length,
          approvedReviews: approvedReviews.length,
          pendingReviews: pendingReviews.length,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewsThisMonth
        }
      };

    } catch (error) {
      console.error('Error getting review statistics:', error);
      return { 
        stats: { totalReviews: 0, approvedReviews: 0, pendingReviews: 0, averageRating: 0, reviewsThisMonth: 0 },
        errors: [error instanceof Error ? error.message : 'Failed to get review statistics'] 
      };
    }
  }
}