'use client';

import React, { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import StarRating from '@/components/ui/StarRating';
import { createReview } from '@/app/actions/review-actions';
import type { CreateReviewInput } from '@/types';

interface ReviewFormProps {
  productId: string;
  productName: string;
  orderItems: Array<{
    orderId: string;
    orderItemId: string;
    productName: string;
    orderDate: string;
  }>;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

export default function ReviewForm({
  productId,
  productName,
  orderItems,
  onReviewSubmitted,
  onCancel
}: ReviewFormProps) {
  const { user } = useUser();
  const [selectedOrderItem, setSelectedOrderItem] = useState(orderItems[0]);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.userId) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (title.trim().length < 5) {
      setError('Review title must be at least 5 characters long');
      return;
    }

    if (comment.trim().length < 20) {
      setError('Review comment must be at least 20 characters long');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reviewData: CreateReviewInput = {
        productId,
        orderId: selectedOrderItem.orderId,
        orderItemId: selectedOrderItem.orderItemId,
        rating,
        title: title.trim(),
        comment: comment.trim()
      };

      const result = await createReview(user.userId, reviewData);

      if (result.errors) {
        setError(result.errors.join(', '));
        return;
      }

      // Success
      onReviewSubmitted();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Write a Review</h3>
          <p className="text-gray-600 mt-1">Share your experience with {productName}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Selection */}
        {orderItems.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Purchase
            </label>
            <select
              value={selectedOrderItem.orderItemId}
              onChange={(e) => {
                const selected = orderItems.find(item => item.orderItemId === e.target.value);
                if (selected) setSelectedOrderItem(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {orderItems.map((item) => (
                <option key={item.orderItemId} value={item.orderItemId}>
                  Purchased on {formatDate(item.orderDate)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Verified Purchase Badge */}
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Verified Purchase - {formatDate(selectedOrderItem.orderDate)}</span>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Rating *
          </label>
          <div className="flex items-center space-x-4">
            <StarRating
              rating={rating}
              interactive={true}
              onRatingChange={setRating}
              size="lg"
            />
            <span className="text-sm text-gray-600">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </span>
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience in a few words"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 characters (minimum 5)
          </p>
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others about your experience with this product. What did you like or dislike? How was the quality, design, and overall satisfaction?"
            rows={6}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/2000 characters (minimum 20)
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Review Guidelines</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Be honest and helpful to other customers</li>
            <li>• Focus on the product's quality, design, and your experience</li>
            <li>• Avoid inappropriate language or personal information</li>
            <li>• Reviews are moderated and may take 24-48 hours to appear</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}