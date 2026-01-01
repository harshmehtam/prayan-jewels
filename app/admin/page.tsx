// Admin dashboard page
'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminLayout, AdminDashboard } from '@/components/admin';

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </AdminRoute>
  );
}