import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TimelyInvoices',
    short_name: 'Timely',
    description: 'Invoicing, quotes, and cashflow for growing businesses.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F6F4F0',
    theme_color: '#1A3A4A',
    icons: [
      { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
