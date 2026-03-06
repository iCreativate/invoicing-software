import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance optimizations */
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Optimize images (Netlify Next.js runtime supports this)
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

  // CSP: strict in production (no unsafe-eval). Dev allows unsafe-eval for HMR/Fast Refresh.
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Production: no 'unsafe-eval' (avoids eval/new Function). Dev: needed for Next.js HMR.
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com",
              isDev
                ? "connect-src 'self' http://localhost:5001 http://localhost:3003 ws://localhost:3003 wss://localhost:3003 https:"
                : "connect-src 'self' https:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
