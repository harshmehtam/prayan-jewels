import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@aws-amplify/ui-react/styles.css";

import { ConditionalLayout } from "@/components/layout";
import { Providers } from "@/components/providers";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";

// Import admin utils for testing (only in development)
if (process.env.NODE_ENV === 'development') {
  import('@/lib/utils/admin-utils');
}

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConfigureAmplifyClientSide />
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
