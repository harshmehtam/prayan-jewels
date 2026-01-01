// Admin users management page
'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminLayout, AdminUserManager } from '@/components/admin';

export default function AdminUsersPage() {
  return (
    <AdminRoute requireSuperAdmin={true}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage admin users, roles, and permissions.
            </p>
          </div>
          <AdminUserManager />
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}