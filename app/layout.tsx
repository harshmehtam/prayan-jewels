import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalLayout } from "@/components/layout";
import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import "./globals.css";
import "@aws-amplify/ui-react/styles.css";
import { getHeaderPromotionalCoupons } from '@/lib/services/coupon-service';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prayan Jewels - Silver Mangalsutra Collection",
  description: "Discover exquisite silver mangalsutra designs at Prayan Jewels. Traditional, modern, and designer pieces crafted with precision and love.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const promotionalCoupon = await getHeaderPromotionalCoupons();
  // const hasPromotion = promotionalCoupon !== null;

  // Serialize coupon data to make it safe for client components
  const serializedCoupon = promotionalCoupon ? {
    id: promotionalCoupon.id,
    code: promotionalCoupon.code,
    type: promotionalCoupon.type,
    value: promotionalCoupon.value,
    minimumOrderAmount: promotionalCoupon.minimumOrderAmount,
  } : null;

  // const headerPaddingClasses = hasPromotion
  //   ? 'pt-28 sm:pt-32 lg:pt-36'
  //   : 'pt-20 sm:pt-24 lg:pt-28';

  // const headerTopPosition = hasPromotion ? 'top-8' : 'top-0';

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div
            className={`relative pt-16 sm:pt-20 lg:pt-24`}
          // style={{ top: headerTopPosition }}
          >
            <ConditionalLayout promotionalCoupon={serializedCoupon}>{children}</ConditionalLayout>
          </div>
        </Providers>
      </body>
    </html>
  );
}
