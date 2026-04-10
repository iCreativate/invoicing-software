'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { RedirectIfReadOnly } from '@/components/workspace/RedirectIfReadOnly';
import { routes } from '@/lib/routing/routes';

const InvoiceComposerModal = dynamic(
  () => import('@/components/invoice/composer/InvoiceComposerModal').then((m) => m.InvoiceComposerModal),
  { ssr: false }
);

export default function EditInvoicePage() {
  const params = useParams();
  const id = String((params as { id?: string }).id ?? '');

  return (
    <RedirectIfReadOnly href={id ? `${routes.app.invoices}/${id}` : routes.app.invoices}>
      <AppShell title="Edit invoice" fullWidth>
        <div className="w-full">
          <InvoiceComposerModal open={true} onOpenChange={() => {}} mode="page" editInvoiceId={id || null} />
        </div>
      </AppShell>
    </RedirectIfReadOnly>
  );
}
