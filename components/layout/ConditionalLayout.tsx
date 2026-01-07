'use client';

import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Pages that should not show the main header and footer
  const isCheckoutFlow = pathname.startsWith('/checkout') || pathname.startsWith('/order-confirmation');
  const isAdminArea = pathname.startsWith('/admin');
  
  if (isCheckoutFlow || isAdminArea) {
    // Minimal layout for checkout flow and admin area
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }
  
  // Default layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}