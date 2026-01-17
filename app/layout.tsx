import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalLayout } from "@/components/layout";
import type { Metadata } from "next";
import "./globals.css";
import "@aws-amplify/ui-react/styles.css";

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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div
          className={`relative pt-10 xs:pt-6`}
        >
          <ConditionalLayout>{children}</ConditionalLayout>
        </div>
      </body>
    </html>
  );
}
