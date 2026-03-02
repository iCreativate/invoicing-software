import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance optimizations */
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Experimental: optimizeCss disabled – can cause 500s/crashes with Tailwind/Turbopack
  experimental: {
    optimizeCss: false,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // CSP: allow 'unsafe-eval' in development only (Next/React dev tooling, HMR)
  async headers() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http://localhost:5001",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' http://localhost:5001 http://localhost:3003 ws://localhost:3003 wss://localhost:3003",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
