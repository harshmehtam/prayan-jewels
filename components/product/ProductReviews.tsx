'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import StarRating, { CompactStarRating } from '@/components/ui/StarRating';
import type { ProductReview, ReviewStats, ReviewFilters } from '@/types';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

// Initialize Amplify client
const client = generateClient<Schema>();

// Custom hook for fetching product reviews
const useProductReviews = (productId: string, filters: ReviewFilters) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
        setError(reviewsResult.errors.map(e => e.message).join(', '));
        return;
      }

      let fetchedReviews = reviewsResult.data || [];

      // Apply rating filter
      if (filters.rating) {
        fetchedReviews = fetchedReviews.filter(review => review.rating === filters.rating);
      }

      // Sort reviews
      const sortedReviews = [...fetchedReviews].sort((a, b) => {
        switch (filters.sortBy) {
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'rating-high':
            return b.rating - a.rating;
          case 'rating-low':
            return a.rating - b.rating;
          case 'helpful':
            return (b.helpfulCount || 0) - (a.helpfulCount || 0);
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });

      setReviews(sortedReviews as unknown as ProductReview[]);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, filters]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return { reviews, loading, error, refetch: loadReviews };
};

// Calculate review statistics
const calculateStats = (reviews: ProductReview[]): ReviewStats => {
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
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
    ratingDistribution
  };
};

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get initials helper
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Review Header Component
const ReviewHeader = ({ stats }: { stats: ReviewStats }) => {
  if (stats.totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
        <p className="text-gray-600">Be the first to share your experience with this product.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Overall Rating */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="text-4xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <div>
            <CompactStarRating rating={stats.averageRating} size="md" />
            <p className="text-sm text-gray-600 mt-1">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

          return (
            <div key={rating} className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 w-8">{rating} ★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Review Filters Component
const ReviewFilters = ({ 
  filters, 
  onFiltersChange, 
  totalReviews 
}: { 
  filters: ReviewFilters; 
  onFiltersChange: (filters: ReviewFilters) => void;
  totalReviews: number;
}) => {
  if (totalReviews === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="rating-high">Highest Rating</option>
          <option value="rating-low">Lowest Rating</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Filter by rating:</label>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => onFiltersChange({
              ...filters,
              rating: filters.rating === rating ? undefined : rating
            })}
            className={`px-2 py-1 text-xs rounded-full border transition-colors ${
              filters.rating === rating
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {rating} ★
          </button>
        ))}
        {filters.rating && (
          <button
            onClick={() => onFiltersChange({ ...filters, rating: undefined })}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

// Review Item Component
const ReviewItem = ({ 
  review, 
  // onHelpfulVote, 
  // isAuthenticated 
}: { 
  review: ProductReview; 
  // onHelpfulVote: (reviewId: string, isHelpful: boolean) => void;
  // isAuthenticated: boolean;
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
          {getInitials('Anonymous User')}
        </div>

        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-sm font-medium text-gray-900">{review.title}</span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600">Anonymous User</span>
                {review.isVerifiedPurchase && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified Purchase
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
          </div>

          {/* Review Content */}
          <div className="text-gray-700 leading-relaxed">
            {review.comment}
          </div>

          {/* Actions */}
          {/* <div className="flex items-center space-x-4 pt-2">
            <span className="text-sm text-gray-500">Was this helpful?</span>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onHelpfulVote(review.id, true)}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => onHelpfulVote(review.id, false)}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  👎 No
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Sign in to vote</span>
            )}
            {review.helpfulCount > 0 && (
              <span className="text-sm text-gray-500">
                {review.helpfulCount} people found this helpful
              </span>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Main Component
export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [filters, setFilters] = useState<ReviewFilters>({ sortBy: 'newest' });
  // const { userProfile, isAuthenticated } = useAuth(); // Use existing auth provider
  const { reviews, loading, error, refetch } = useProductReviews(productId, filters);

  // Memoize stats calculation
  const stats = useMemo(() => calculateStats(reviews), [reviews]);

  // const handleHelpfulVote = useCallback(async (reviewId: string, isHelpful: boolean) => {
  //   if (!userProfile?.userId) return;

  //   try {
  //     // Check if user already voted on this review
  //     const existingVoteResult = await client.models.ReviewHelpfulVote.list({
  //       filter: {
  //         and: [
  //           { reviewId: { eq: reviewId } },
  //           { customerId: { eq: userProfile.userId } }
  //         ]
  //       }
  //     });

  //     const existingVote = existingVoteResult.data?.[0];

  //     if (existingVote) {
  //       // Update existing vote
  //       await client.models.ReviewHelpfulVote.update({
  //         id: existingVote.id,
  //         isHelpful
  //       });
  //     } else {
  //       // Create new vote
  //       await client.models.ReviewHelpfulVote.create({
  //         reviewId,
  //         customerId: userProfile.userId,
  //         isHelpful
  //       });
  //     }

  //     // Update helpful count
  //     const votesResult = await client.models.ReviewHelpfulVote.list({
  //       filter: { reviewId: { eq: reviewId } }
  //     });

  //     const votes = votesResult.data || [];
  //     const helpfulCount = votes.filter(vote => vote.isHelpful).length;

  //     await client.models.ProductReview.update({
  //       id: reviewId,
  //       helpfulCount
  //     });

  //     // Refetch reviews to show updated counts
  //     refetch();
  //   } catch (err) {
  //     console.error('Error voting on review:', err);
  //   }
  // }, [userProfile?.userId, refetch]);

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>
        <ReviewHeader stats={stats} />
      </div>

      {/* Filters and Sorting */}
      <ReviewFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        totalReviews={stats.totalReviews}
      />

      {/* Reviews List */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          {/* Empty state already shown in ReviewHeader */}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewItem 
              key={review.id} 
              review={review} 
              // onHelpfulVote={handleHelpfulVote}
              // isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}