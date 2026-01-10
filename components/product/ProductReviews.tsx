'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import StarRating, { CompactStarRating } from '@/components/ui/StarRating';
import ReviewForm from './ReviewForm';
import { ReviewService } from '@/lib/services/review-service';
import type { ProductReview, ReviewStats, ReviewFilters } from '@/types';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [user, setUser] = useState<{ userId: string } | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [orderItems, setOrderItems] = useState<Array<{
    orderId: string;
    orderItemId: string;
    productName: string;
    orderDate: string;
  }>>([]);
  const [existingReview, setExistingReview] = useState<ProductReview | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>({
    sortBy: 'newest'
  });

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser({ userId: currentUser.userId });
      } catch (error) {
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  // Load reviews and check review eligibility
  useEffect(() => {
    loadReviews();
    if (user?.userId) {
      checkReviewEligibility();
    }
  }, [productId, user?.userId, filters]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await ReviewService.getProductReviews(productId, filters);

      if (result.errors) {
        setError(result.errors.join(', '));
        return;
      }

      setReviews(result.reviews);
      setStats(result.stats);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    if (!user?.userId) return;

    try {
      const result = await ReviewService.canUserReviewProduct(user.userId, productId);
      setCanReview(result.canReview);
      setOrderItems(result.orderItems);
      setExistingReview(result.existingReview || null);
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    loadReviews();
    checkReviewEligibility();
  };

  const handleHelpfulVote = async (reviewId: string, isHelpful: boolean) => {
    if (!user?.userId) return;

    try {
      const result = await ReviewService.voteReviewHelpful(user.userId, reviewId, isHelpful);
      if (result.success) {
        // Reload reviews to update helpful counts
        loadReviews();
      }
    } catch (err) {
      console.error('Error voting on review:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (showReviewForm) {
    return (
      <ReviewForm
        productId={productId}
        productName={productName}
        orderItems={orderItems}
        onReviewSubmitted={handleReviewSubmitted}
        onCancel={() => setShowReviewForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>

        {stats.totalReviews > 0 ? (
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
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
            <p className="text-gray-600">Be the first to share your experience with this product.</p>
          </div>
        )}

        {/* Write Review Button */}
        {user ? (
          <div className="mt-6">
            {canReview ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Write a Review</span>
              </button>
            ) : existingReview && (
              <div className="flex items-center space-x-3">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-800">
                    You've already reviewed this product
                    {!existingReview.isApproved && ' (pending approval)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-600">
                Please sign in to write a review.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Sorting */}
      {stats.totalReviews > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
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
                onClick={() => setFilters({
                  ...filters,
                  rating: filters.rating === rating ? undefined : rating
                })}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${filters.rating === rating
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {rating} ★
              </button>
            ))}
            {filters.rating && (
              <button
                onClick={() => setFilters({ ...filters, rating: undefined })}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
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
          <p className="text-gray-600">
            {filters.rating ? `No ${filters.rating}-star reviews found.` : 'No reviews match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-6">
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
                  <div className="flex items-center space-x-4 pt-2">
                    <span className="text-sm text-gray-500">Was this helpful?</span>
                    {user ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleHelpfulVote(review.id, true)}
                          className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          👍 Yes
                        </button>
                        <button
                          onClick={() => handleHelpfulVote(review.id, false)}
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}