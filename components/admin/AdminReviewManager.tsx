'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import StarRating from '@/components/ui/StarRating';
import { LoadingSpinner } from '@/components/ui';
import { AdminReviewService } from '@/lib/services/admin-review-service';
import { PermissionGate } from '@/components/auth/AdminRoute';
import type { ProductReview, ReviewFilters } from '@/types';

interface AdminReviewManagerProps {
  className?: string;
}

export default function AdminReviewManager({ className = '' }: AdminReviewManagerProps) {
  const { userId } = useRoleAccess();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ReviewFilters & { isApproved?: boolean }>({
    sortBy: 'newest',
    isApproved: undefined // Show all by default
  });
  const [stats, setStats] = useState({
    totalReviews: 0,
    approvedReviews: 0,
    pendingReviews: 0,
    averageRating: 0,
    reviewsThisMonth: 0
  });
  const [processingAction, setProcessingAction] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await AdminReviewService.getAllReviews(filters);
      
      if (result.errors) {
        setError(result.errors.join(', '));
        return;
      }

      setReviews(result.reviews);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      const result = await AdminReviewService.getReviewStatistics();
      if (!result.errors) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [loadReviews, loadStats]);

  const handleApproveReview = async (reviewId: string) => {
    if (!userId) return;

    try {
      setProcessingAction(true);
      const result = await AdminReviewService.approveReview(userId, reviewId);
      
      if (result.errors) {
        setError(result.errors.join(', '));
        return;
      }

      await loadReviews();
      await loadStats();
    } catch (err) {
      console.error('Error approving review:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve review');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!userId) return;

    try {
      setProcessingAction(true);
      const result = await AdminReviewService.rejectReview(userId, reviewId);
      
      if (result.errors) {
        setError(result.errors.join(', '));
        return;
      }

      await loadReviews();
      await loadStats();
    } catch (err) {
      console.error('Error rejecting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject review');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessingAction(true);
      const result = await AdminReviewService.deleteReview(reviewId);
      
      if (result.errors) {
        setError(result.errors.join(', '));
        return;
      }

      await loadReviews();
      await loadStats();
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBulkApprove = async () => {
    if (!userId || selectedReviews.size === 0) return;

    if (!confirm(`Are you sure you want to approve ${selectedReviews.size} reviews?`)) {
      return;
    }

    try {
      setProcessingAction(true);
      const result = await AdminReviewService.bulkApproveReviews(
        userId, 
        Array.from(selectedReviews)
      );
      
      if (result.errors) {
        setError(result.errors.join(', '));
      }

      setSelectedReviews(new Set());
      await loadReviews();
      await loadStats();
    } catch (err) {
      console.error('Error bulk approving reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk approve reviews');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBulkReject = async () => {
    if (!userId || selectedReviews.size === 0) return;

    if (!confirm(`Are you sure you want to reject ${selectedReviews.size} reviews?`)) {
      return;
    }

    try {
      setProcessingAction(true);
      const result = await AdminReviewService.bulkRejectReviews(
        userId, 
        Array.from(selectedReviews)
      );
      
      if (result.errors) {
        setError(result.errors.join(', '));
      }

      setSelectedReviews(new Set());
      await loadReviews();
      await loadStats();
    } catch (err) {
      console.error('Error bulk rejecting reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk reject reviews');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReviewSelect = (reviewId: string, selected: boolean) => {
    const newSelected = new Set(selectedReviews);
    if (selected) {
      newSelected.add(reviewId);
    } else {
      newSelected.delete(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedReviews(new Set(reviews.map(r => r.id)));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-600 mt-1">Moderate and manage customer reviews</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.totalReviews}</div>
          <div className="text-sm text-gray-600">Total Reviews</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.approvedReviews}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.reviewsThisMonth}</div>
          <div className="text-sm text-gray-600">This Month</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.isApproved === undefined ? 'all' : filters.isApproved ? 'approved' : 'pending'}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  isApproved: value === 'all' ? undefined : value === 'approved'
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Reviews</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <select
              value={filters.rating || 'all'}
              onChange={(e) => setFilters({
                ...filters,
                rating: e.target.value === 'all' ? undefined : parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating-high">Highest Rating</option>
              <option value="rating-low">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadReviews}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReviews.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedReviews.size} reviews selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <PermissionGate resource="admin/reviews" action="update">
                <button
                  onClick={handleBulkApprove}
                  disabled={processingAction}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Approve Selected
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={processingAction}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Reject Selected
                </button>
              </PermissionGate>
              <button
                onClick={() => setSelectedReviews(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
            <p className="mt-1 text-sm text-gray-500">No reviews match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReviews.size === reviews.length && reviews.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.has(review.id)}
                        onChange={(e) => handleReviewSelect(review.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-sm font-medium text-gray-900">{review.title}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                          {review.comment}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>👍 {review.helpfulCount}</span>
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Product ID: {review.productId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        review.isApproved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <PermissionGate resource="admin/reviews" action="update">
                          {!review.isApproved ? (
                            <button
                              onClick={() => handleApproveReview(review.id)}
                              disabled={processingAction}
                              className="text-green-600 hover:text-green-900 text-sm disabled:opacity-50"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRejectReview(review.id)}
                              disabled={processingAction}
                              className="text-yellow-600 hover:text-yellow-900 text-sm disabled:opacity-50"
                            >
                              Unapprove
                            </button>
                          )}
                        </PermissionGate>
                        <PermissionGate resource="admin/reviews" action="delete">
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={processingAction}
                            className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}