import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TimelyInvoices',
    short_name: 'Timely',
    description: 'Invoicing, quotes, and cashflow for growing businesses.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
  };
}
