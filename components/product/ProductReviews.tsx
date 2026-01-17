import { getProductReviews } from '@/lib/services/review-service';
import StarRating, { CompactStarRating } from '@/components/ui/StarRating';
import type { ProductReview, ReviewStats } from '@/types';

interface ProductReviewsProps {
  productId: string;
}

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

// Review Item Component
const ReviewItem = ({ review }: { review: ProductReview }) => {
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
              </div>
            </div>
            <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
          </div>

          {/* Review Content */}
          <div className="text-gray-700 leading-relaxed">
            {review.comment}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Server Component
export default async function ProductReviews({ productId }: ProductReviewsProps) {
  // Fetch reviews on the server
  const { reviews, stats, errors } = await getProductReviews(productId);

  if (errors && errors.length > 0) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">{errors.join(', ')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>
        <ReviewHeader stats={stats} />
      </div>

      {/* Reviews List */}
      {stats.totalReviews > 0 && (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}