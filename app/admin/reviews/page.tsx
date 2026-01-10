import { Metadata } from 'next';
import AdminReviewManager from '@/components/admin/AdminReviewManager';

export const metadata: Metadata = {
  title: 'Review Management - Admin',
  description: 'Manage and moderate customer reviews',
};

export default function AdminReviewsPage() {
  return <AdminReviewManager />;
}