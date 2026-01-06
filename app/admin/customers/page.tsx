// Admin customer management page
'use client';

import { AdminCustomerManager } from '@/components/admin';

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600 mt-1">
          View and manage customer accounts, order history, and account activity.
        </p>
      </div>
      <AdminCustomerManager />
    </div>
  );
}