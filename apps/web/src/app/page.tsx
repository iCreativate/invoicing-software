import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

const siteUrl = 'https://timelyinvoices.com';
const ogTitle = 'TimelyInvoices — ZAR invoices, quotes & VAT for SA';
const ogDescription =
  'Create professional ZAR invoices and quotes with VAT. Email or share a public link, and get paid by EFT to your business bank details.';
const ogImage = {
  url: `${siteUrl}/og-app.png`,
  width: 1200,
  height: 630,
  alt: 'TimelyInvoices — ZAR invoices, quotes and VAT for South African businesses',
  type: 'image/png',
} as const;

export const metadata: Metadata = {
  title: ogTitle,
  description: ogDescription,
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: siteUrl,
    type: 'website',
    siteName: 'TimelyInvoices',
    locale: 'en_ZA',
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: ogTitle,
    description: ogDescription,
    images: [ogImage.url],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function Home() {
  return <LandingPage />;
}
