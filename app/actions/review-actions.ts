'use server';

import { revalidatePath } from 'next/cache';
import * as reviewService from '@/lib/services/review-service';
import type { 
  ProductReview, 
  CreateReviewInput, 
  UpdateReviewInput, 
  ReviewStats
} from '@/types';

/**
 * Check if user can review a product
 */
export async function canUserReviewProduct(
  customerId: string, 
  productId: string
): Promise<{
  canReview: boolean;
  orderItems: Array<{ orderId: string; orderItemId: string; productName: string; orderDate: string }>;
  existingReview?: ProductReview;
}> {
  try {
    return await reviewService.canUserReviewProduct(customerId, productId);
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return {
      canReview: false,
      orderItems: []
    };
  }
}

/**
 * Create a new review
 */
export async function createReview(
  customerId: string, 
  reviewData: CreateReviewInput
): Promise<{
  review?: ProductReview;
  errors?: string[];
}> {
  try {
    const result = await reviewService.createReview(customerId, reviewData);
    
    if (result.review) {
      revalidatePath(`/products/${reviewData.productId}`);
      revalidatePath('/account/reviews');
    }
    
    return result;
  } catch (error) {
    console.error('Error creating review:', error);
    return {
      errors: ['Failed to create review. Please try again.']
    };
  }
}

/**
 * Update an existing review
 */
export async function updateReview(
  customerId: string, 
  reviewData: UpdateReviewInput
): Promise<{
  review?: ProductReview;
  errors?: string[];
}> {
  try {
    const result = await reviewService.updateReview(customerId, reviewData);
    
    if (result.review) {
      revalidatePath(`/products/${result.review.productId}`);
      revalidatePath('/account/reviews');
    }
    
    return result;
  } catch (error) {
    console.error('Error updating review:', error);
    return {
      errors: ['Failed to update review. Please try again.']
    };
  }
}

/**
 * Get reviews for a product
 */
export async function getProductReviews(productId: string): Promise<{
  reviews: ProductReview[];
  stats: ReviewStats;
  errors?: string[];
}> {
  try {
    return await reviewService.getProductReviews(productId);
  } catch (error) {
    console.error('Error getting product reviews:', error);
    return {
      reviews: [],
      stats: { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      errors: ['Failed to load reviews']
    };
  }
}

/**
 * Get user's reviews
 */
export async function getUserReviews(customerId: string): Promise<{
  reviews: ProductReview[];
  errors?: string[];
}> {
  try {
    return await reviewService.getUserReviews(customerId);
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return {
      reviews: [],
      errors: ['Failed to load your reviews']
    };
  }
}

/**
 * Delete a review
 */
export async function deleteReview(
  customerId: string, 
  reviewId: string,
  productId?: string
): Promise<{
  success: boolean;
  errors?: string[];
}> {
  try {
    const result = await reviewService.deleteReview(customerId, reviewId);
    
    if (result.success) {
      if (productId) {
        revalidatePath(`/products/${productId}`);
      }
      revalidatePath('/account/reviews');
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting review:', error);
    return {
      success: false,
      errors: ['Failed to delete review. Please try again.']
    };
  }
}
