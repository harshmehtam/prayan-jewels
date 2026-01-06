'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';

// Admin section layout with authentication enforcement
export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminRoute>
  );
}