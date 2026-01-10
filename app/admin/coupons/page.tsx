'use client';

import { AdminRoute } from '@/components/auth/AdminRoute';
import AdminCouponManager from '@/components/admin/AdminCouponManager';

export default function AdminCouponsPage() {
  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <AdminCouponManager />
      </div>
    </AdminRoute>
  );
}