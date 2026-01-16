'use client';

import { usePathname } from "next/navigation";
import { Header, Footer } from "@/components/layout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  promotionalCoupon?: any | null;
}

export default function ConditionalLayout({ children, promotionalCoupon = null }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Determine layout type based on pathname
  const isMinimalLayout =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/order-confirmation");

  if (isMinimalLayout) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Default layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header promotionalCoupon={promotionalCoupon} />
      <main className="flex-1 pt-0">{children}</main>
      <Footer />
    </div>
  );
}