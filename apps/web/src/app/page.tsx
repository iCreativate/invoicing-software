import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Timely — Send invoices. Get paid. Stay ahead.',
  description:
    'Timely helps you invoice, collect payments and understand your cash flow — without spending your day chasing clients. Built for South African businesses.',
  openGraph: {
    title: 'Timely — Send invoices. Get paid. Stay ahead.',
    description:
      'Invoice, collect and understand your cash flow in one place. No credit card required.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Timely — Send invoices. Get paid. Stay ahead.',
    description: 'Invoice, collect and understand your cash flow — without the chase.',
  },
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <LandingPage />;
}
