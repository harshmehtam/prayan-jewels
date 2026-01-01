// Admin inventory control page
'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminLayout } from '@/components/admin';
import AdminInventoryManager from '@/components/admin/AdminInventoryManager';

export default function AdminInventoryPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminInventoryManager />
      </AdminLayout>
    </AdminRoute>
  );
}