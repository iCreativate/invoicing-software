import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'TimelyInvoices — Invoice. Collect. Understand.',
  description:
    'Premium invoicing and cashflow for South African SMEs. Send invoices, collect payments, and see what is outstanding — without accounting complexity.',
  openGraph: {
    title: 'TimelyInvoices — Invoice. Collect. Understand.',
    description:
      'One clear place to send invoices, collect payments and understand cashflow for South African businesses.',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <LandingPage />;
}
