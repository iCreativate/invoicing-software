'use client';

import { AppShell } from '@/components/layout/AppShell';
import dynamic from 'next/dynamic';

const InvoiceComposerModal = dynamic(
  () => import('@/components/invoice/composer/InvoiceComposerModal').then((m) => m.InvoiceComposerModal),
  { ssr: false }
);

export default function NewInvoicePage() {
  return (
    <AppShell title="New invoice" fullWidth>
      <div className="w-full">
        <InvoiceComposerModal open={true} onOpenChange={() => {}} mode="page" />
      </div>
    </AppShell>
  );
}

