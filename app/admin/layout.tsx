import { AdminRoute } from '@/components/auth/AdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';

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