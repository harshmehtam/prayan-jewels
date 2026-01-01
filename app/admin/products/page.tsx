// Admin products management page
'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminLayout } from '@/components/admin';
import { AdminProductManager } from '@/components/admin';

export default function AdminProductsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminProductManager />
      </AdminLayout>
    </AdminRoute>
  );
}