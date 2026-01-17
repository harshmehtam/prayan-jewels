import Link from 'next/link';
import { getCurrentUserServer } from '@/lib/services/auth-service.server';
import { getCustomerOrders } from '@/lib/services/order-service';
import { 
  getStatusColor, 
  formatOrderNumber, 
  formatCurrency, 
  formatOrderDate 
} from '@/lib/utils/order-utils';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  // Middleware ensures authentication, so we can directly get user
  const user = await getCurrentUserServer();

  // Load only the 3 most recent orders
  const orders = await getCustomerOrders(user!.userId, 3);

  return (
    <div className="container mx-auto px-4 pt-52 sm:pt-44 lg:pt-48 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user!.firstName || 'User'}!
          </p>
        </div>

        {/* Account Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Orders */}
          <Link
            href="/account/orders"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Orders</h3>
              <p className="text-sm text-gray-500">View order history</p>
            </div>
          </Link>

          {/* Profile */}
          <Link
            href="/account/profile"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Profile</h3>
              <p className="text-sm text-gray-500">Manage your profile</p>
            </div>
          </Link>

          {/* Addresses */}
          <Link
            href="/account/addresses"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Addresses</h3>
              <p className="text-sm text-gray-500">Manage addresses</p>
            </div>
          </Link>

          {/* Reviews */}
          <Link
            href="/account/reviews"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Reviews</h3>
              <p className="text-sm text-gray-500">My product reviews</p>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
              <Link
                href="/account/orders"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all orders
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const orderData = order as Record<string, unknown>;
                  const status = (orderData.status as string) || 'pending';
                  
                  return (
                    <div key={orderData.id as string} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Order {formatOrderNumber({
                            confirmationNumber: orderData.confirmationNumber as string | null,
                            id: orderData.id as string
                          })}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatOrderDate(orderData.createdAt as string)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(orderData.totalAmount as number)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}