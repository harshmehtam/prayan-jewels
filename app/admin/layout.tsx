// Admin section layout with dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}