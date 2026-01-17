'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StarRating from '@/components/ui/StarRating';
import { getUserReviews } from '@/app/actions/review-actions';
import { useUser } from '@/hooks/use-user';

interface Review {
  id: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
}

export default function UserReviews() {
  const { user, isLoading: isUserLoading } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && user?.userId) {
      const fetchReviews = async () => {
        try {
          const result = await getUserReviews(user.userId);
          
          if (result.errors) {
            setError(result.errors.join(', '));
          } else {
            setReviews(result.reviews);
          }
        } catch (err) {
          console.error('Error fetching reviews:', err);
          setError('Failed to load reviews');
        } finally {
          setIsLoading(false);
        }
      };

      fetchReviews();
    } else if (!isUserLoading) {
      setIsLoading(false);
    }
  }, [user?.userId, isUserLoading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (isLoading || isUserLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user?.userId) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in</h3>
        <p className="text-gray-600 mb-6">
          Sign in to view your reviews
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-600 mb-6">
          You haven't written any reviews yet. Purchase and receive products to start reviewing.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Reviews</h2>
        <span className="text-sm text-gray-600">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-start space-x-4">
              {/* Product Link */}
              <Link 
                href={`/products/${review.productId}`}
                className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
              >
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-sm font-medium text-gray-900">{review.title}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Product ID: {review.productId}</span>
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                      {review.isVerifiedPurchase && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verified Purchase
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    review.isApproved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {review.isApproved ? 'Published' : 'Pending Approval'}
                  </span>
                </div>

                {/* Review Content */}
                <div className="text-gray-700 leading-relaxed mb-4">
                  {review.comment}
                </div>

                {/* Review Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {review.helpfulCount > 0 && (
                      <span>{review.helpfulCount} people found this helpful</span>
                    )}
                  </div>

                  <Link
                    href={`/products/${review.productId}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}