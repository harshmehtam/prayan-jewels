// Admin customer management page
'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminLayout, AdminCustomerManager } from '@/components/admin';

export default function AdminCustomersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1">
              View and manage customer accounts, order history, and account activity.
            </p>
          </div>
          <AdminCustomerManager />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}