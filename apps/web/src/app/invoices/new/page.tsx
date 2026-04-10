'use client';

import { AppShell } from '@/components/layout/AppShell';
import dynamic from 'next/dynamic';
import { RedirectIfReadOnly } from '@/components/workspace/RedirectIfReadOnly';
import { routes } from '@/lib/routing/routes';

const InvoiceComposerModal = dynamic(
  () => import('@/components/invoice/composer/InvoiceComposerModal').then((m) => m.InvoiceComposerModal),
  { ssr: false }
);

export default function NewInvoicePage() {
  return (
    <RedirectIfReadOnly href={routes.app.invoices}>
      <AppShell title="New invoice" fullWidth>
        <div className="w-full">
          <InvoiceComposerModal open={true} onOpenChange={() => {}} mode="page" />
        </div>
      </AppShell>
    </RedirectIfReadOnly>
  );
}

