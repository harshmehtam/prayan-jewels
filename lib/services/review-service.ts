import { cookiesClient } from '@/utils/amplify-utils';
import type { 
  ProductReview, 
  CreateReviewInput, 
  UpdateReviewInput, 
  ReviewFilters, 
  ReviewStats
} from '@/types';

/**
 * Check if user can review a product (must have purchased it)
 */
export const canUserReviewProduct = async (customerId: string, productId: string): Promise<{
  canReview: boolean;
  orderItems: Array<{ orderId: string; orderItemId: string; productName: string; orderDate: string }>;
  existingReview?: ProductReview;
}> => {
  try {
    const client = await cookiesClient;
    
    // Get all orders for this customer
    const ordersResult = await client.models.Order.list({
      filter: { 
        customerId: { eq: customerId },
        status: { eq: 'delivered' } // Only delivered orders can be reviewed
      }
    });

    if (ordersResult.errors) {
      throw new Error(ordersResult.errors[0].message);
    }

    const orders = ordersResult.data || [];
    const orderIds = orders.map(order => order.id);

    if (orderIds.length === 0) {
      return { canReview: false, orderItems: [] };
    }

    // Get order items for this product from customer's orders
    let orderItems: any[] = [];
    
    // Query order items for each order ID separately to avoid 'in' filter issue
    for (const orderId of orderIds) {
      const orderItemsResult = await client.models.OrderItem.list({
        filter: {
          and: [
            { productId: { eq: productId } },
            { orderId: { eq: orderId } }
          ]
        }
      });

      if (orderItemsResult.errors) {
        throw new Error(orderItemsResult.errors[0].message);
      }

      orderItems = orderItems.concat(orderItemsResult.data || []);
    }

    if (orderItems.length === 0) {
      return { canReview: false, orderItems: [] };
    }

    // Check if user already reviewed this product
    const existingReviewResult = await client.models.ProductReview.list({
      filter: {
        and: [
          { customerId: { eq: customerId } },
          { productId: { eq: productId } }
        ]
      }
    });

    const existingReview = existingReviewResult.data?.[0];

    // Format order items with order dates
    const orderItemsWithDates = orderItems.map(item => {
      const order = orders.find(o => o.id === item.orderId);
      return {
        orderId: item.orderId,
        orderItemId: item.id,
        productName: item.productName,
        orderDate: order?.createdAt || item.createdAt
      };
    });

    return {
      canReview: !existingReview, // Can review if no existing review
      orderItems: orderItemsWithDates,
      existingReview: existingReview as unknown as ProductReview
    };

  } catch (error) {
    console.error('Error checking review eligibility:', error);
    throw error;
  }
};

/**
 * Create a new review
 */
export const createReview = async (customerId: string, reviewData: CreateReviewInput): Promise<{
  review?: ProductReview;
  errors?: string[];
}> => {
  try {
    const client = await cookiesClient;
    
    // Verify user can review this product
    const eligibility = await canUserReviewProduct(customerId, reviewData.productId);
    
    if (!eligibility.canReview) {
      return { errors: ['You can only review products you have purchased and received'] };
    }

    if (eligibility.existingReview) {
      return { errors: ['You have already reviewed this product'] };
    }

    // Validate the order item belongs to the customer
    const orderItemExists = eligibility.orderItems.some(
      item => item.orderItemId === reviewData.orderItemId && item.orderId === reviewData.orderId
    );

    if (!orderItemExists) {
      return { errors: ['Invalid order information'] };
    }

    // Create the review
    const result = await client.models.ProductReview.create({
      productId: reviewData.productId,
      customerId,
      orderId: reviewData.orderId,
      orderItemId: reviewData.orderItemId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      isApproved: false, // Requires admin approval
      isVerifiedPurchase: true,
      helpfulCount: 0,
      reportCount: 0
    });

    if (result.errors) {
      return { errors: result.errors.map(e => e.message) };
    }

    return { review: result.data as unknown as ProductReview };

  } catch (error) {
    console.error('Error creating review:', error);
    return { errors: [error instanceof Error ? error.message : 'Failed to create review'] };
  }
};

/**
 * Update an existing review (only by the author)
 */
export const updateReview = async (customerId: string, reviewData: UpdateReviewInput): Promise<{
  review?: ProductReview;
  errors?: string[];
}> => {
  try {
    const client = await cookiesClient;
    
    // Get existing review and verify ownership
    const existingResult = await client.models.ProductReview.get({ id: reviewData.id });
    
    if (existingResult.errors) {
      return { errors: existingResult.errors.map(e => e.message) };
    }

    const existingReview = existingResult.data;
    if (!existingReview) {
      return { errors: ['Review not found'] };
    }

    if (existingReview.customerId !== customerId) {
      return { errors: ['You can only edit your own reviews'] };
    }

    // Update the review (will require re-approval)
    const result = await client.models.ProductReview.update({
      id: reviewData.id,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      isApproved: false // Reset approval status when edited
    });

    if (result.errors) {
      return { errors: result.errors.map(e => e.message) };
    }

    return { review: result.data as unknown as ProductReview };

  } catch (error) {
    console.error('Error updating review:', error);
    return { errors: [error instanceof Error ? error.message : 'Failed to update review'] };
  }
};

/**
 * Get reviews for a product (only approved reviews for public view)
 * This method works for both authenticated and guest users
 */
export const getProductReviews = async (productId: string, filters: ReviewFilters = {}): Promise<{
  reviews: ProductReview[];
  stats: ReviewStats;
  errors?: string[];
}> => {
  try {
    const client = await cookiesClient;
    
    // Get all approved reviews for the product
    const reviewsResult = await client.models.ProductReview.list({
      filter: {
        and: [
          { productId: { eq: productId } },
          { isApproved: { eq: true } }
        ]
      }
    });

    if (reviewsResult.errors) {
      return { 
        reviews: [], 
        stats: { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        errors: reviewsResult.errors.map(e => e.message) 
      };
    }

    let reviews = reviewsResult.data || [];

    // Apply rating filter
    if (filters.rating) {
      reviews = reviews.filter(review => review.rating === filters.rating);
    }

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

    // Calculate stats
    const stats = calculateReviewStats(reviews as unknown as ProductReview[]);

    return { 
      reviews: reviews as unknown as ProductReview[], 
      stats 
    };

  } catch (error) {
    return { 
      reviews: [], 
      stats: { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      errors: [error instanceof Error ? error.message : 'Failed to fetch reviews']
    };
  }
};

/**
 * Calculate review statistics
 */
const calculateReviewStats = (reviews: ProductReview[]): ReviewStats => {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
    ratingDistribution
  };
};

/**
 * Vote on review helpfulness
 */
export const voteReviewHelpful = async (customerId: string, reviewId: string, isHelpful: boolean): Promise<{
  success: boolean;
  errors?: string[];
}> => {
  try {
    const client = await cookiesClient;
    
    // Check if user already voted on this review
    const existingVoteResult = await client.models.ReviewHelpfulVote.list({
      filter: {
        and: [
          { reviewId: { eq: reviewId } },
          { customerId: { eq: customerId } }
        ]
      }
    });

    if (existingVoteResult.errors) {
      return { success: false, errors: existingVoteResult.errors.map(e => e.message) };
    }

    const existingVote = existingVoteResult.data?.[0];

    if (existingVote) {
      // Update existing vote
      const updateResult = await client.models.ReviewHelpfulVote.update({
        id: existingVote.id,
        isHelpful
      });

      if (updateResult.errors) {
        return { success: false, errors: updateResult.errors.map(e => e.message) };
      }
    } else {
      // Create new vote
      const createResult = await client.models.ReviewHelpfulVote.create({
        reviewId,
        customerId,
        isHelpful
      });

      if (createResult.errors) {
        return { success: false, errors: createResult.errors.map(e => e.message) };
      }
    }

    // Update helpful count on the review
    await updateReviewHelpfulCount(reviewId);

    return { success: true };

  } catch (error) {
    console.error('Error voting on review:', error);
    return { success: false, errors: [error instanceof Error ? error.message : 'Failed to vote on review'] };
  }
};

/**
 * Update helpful count for a review
 */
const updateReviewHelpfulCount = async (reviewId: string): Promise<void> => {
  try {
    const client = await cookiesClient;
    
    // Get all helpful votes for this review
    const votesResult = await client.models.ReviewHelpfulVote.list({
      filter: { reviewId: { eq: reviewId } }
    });

    if (votesResult.errors) {
      throw new Error(votesResult.errors[0].message);
    }

    const votes = votesResult.data || [];
    const helpfulCount = votes.filter(vote => vote.isHelpful).length;

    // Update the review
    await client.models.ProductReview.update({
      id: reviewId,
      helpfulCount
    });

  } catch (error) {
    console.error('Error updating helpful count:', error);
  }
};

/**
 * Get user's reviews
 */
export const getUserReviews = async (customerId: string): Promise<{
  reviews: ProductReview[];
  errors?: string[];
}> => {
  try {
    const client = await cookiesClient;
    
    const result = await client.models.ProductReview.list({
      filter: { customerId: { eq: customerId } }
    });

    if (result.errors) {
      return { reviews: [], errors: result.errors.map(e => e.message) };
    }

    return { reviews: result.data as unknown as ProductReview[] };

  } catch (error) {
    console.error('Error getting user reviews:', error);
    return { reviews: [], errors: [error instanceof Error ? error.message : 'Failed to fetch user reviews'] };
  }
};

/**
 * Delete a review (only by the author)
 */
export const deleteReview = async (customerId: string, reviewId: string): Promise<{
  success: boolean;
  errors?: string[];
}> => {
  try {
    const client = await cookiesClient;
    
    // Get existing review and verify ownership
    const existingResult = await client.models.ProductReview.get({ id: reviewId });
    
    if (existingResult.errors) {
      return { success: false, errors: existingResult.errors.map(e => e.message) };
    }

    const existingReview = existingResult.data;
    if (!existingReview) {
      return { success: false, errors: ['Review not found'] };
    }

    if (existingReview.customerId !== customerId) {
      return { success: false, errors: ['You can only delete your own reviews'] };
    }

    // Delete the review
    const result = await client.models.ProductReview.delete({ id: reviewId });

    if (result.errors) {
      return { success: false, errors: result.errors.map(e => e.message) };
    }

    return { success: true };

  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false, errors: [error instanceof Error ? error.message : 'Failed to delete review'] };
  }
};