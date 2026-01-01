// Admin orders page with role-based access control
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminLayout } from '@/components/admin';
import AdminOrderManager from '@/components/admin/AdminOrderManager';

export const dynamic = 'force-dynamic';

export default function AdminOrdersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminOrderManager />
      </AdminLayout>
    </AdminRoute>
  );
}