import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account - Prayan Jewels',
  description: 'Manage your account, orders, and addresses',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}