import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Basic image optimization settings
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 640, 768, 1024, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    
    // Basic remote patterns for any external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    
    domains: [],
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  
  // Compression
  compress: true,
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
