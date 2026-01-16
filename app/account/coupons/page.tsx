import UserCoupons from '@/components/account/UserCoupons';
import { getCurrentUserServer } from '@/lib/services/auth-service';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountCouponsPage() {
  const user = await getCurrentUserServer();

  // Redirect if not authenticated
  if (!user?.userId) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/account"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Coupons</h1>
          </div>
          <p className="text-gray-600">
            View and manage your discount coupons
          </p>
        </div>

        {/* User Coupons Component */}
        <UserCoupons />
      </div>
    </div>
  );
}