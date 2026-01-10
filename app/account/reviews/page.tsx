import { Metadata } from 'next';
import UserReviews from '@/components/account/UserReviews';

export const metadata: Metadata = {
  title: 'My Reviews - Account',
  description: 'View and manage your product reviews',
};

export default function AccountReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600 mt-1">
          View and manage your product reviews and ratings
        </p>
      </div>
      
      <UserReviews />
    </div>
  );
}