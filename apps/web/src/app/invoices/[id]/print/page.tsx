'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { invoiceApiToPreviewDraft } from '@/features/invoices/previewMap';
import { fetchMyCompanyProfile, subscriptionShowsPoweredBy } from '@/features/company/api';
import { buildPublicInvoiceViewUrl } from '@/lib/invoice/platformUrls';
import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';

export default function InvoicePrintPage() {
  const params = useParams();
  const id = String((params as { id?: string }).id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const [invRes, co] = await Promise.all([fetch(`/api/invoices/${id}`), fetchMyCompanyProfile()]);
        const json = await invRes.json();
        if (!invRes.ok || !json.success) throw new Error(json.error ?? 'Failed to load');
        if (!alive) return;
        setInvoice(json.data.invoice);
        setCompany(co);
      } catch (e: any) {
        if (alive) setError(e?.message ?? 'Failed to load');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!invoice) return;
    const t = window.setTimeout(() => window.print(), 1000);
    return () => window.clearTimeout(t);
  }, [invoice]);

  if (error) {
    return (
      <div className="min-h-dvh bg-background p-8 text-center text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!invoice) {
    return <div className="min-h-dvh bg-background p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const draft = invoiceApiToPreviewDraft(invoice);
  const client = invoice.client ?? {};
  const poweredBy = subscriptionShowsPoweredBy(company?.subscriptionPlan ?? null);
  const invoiceViewUrl = buildPublicInvoiceViewUrl(invoice?.public_share_id);

  return (
    <div className="min-h-dvh bg-background p-4 print:p-0">
      <div className="mx-auto max-w-4xl print:max-w-none">
        <div className="mb-4 flex justify-end print:hidden">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print / PDF
          </Button>
        </div>
        <div className="ti-print-area">
          <InvoicePreview
            companyName={company?.companyName ?? 'TimelyInvoices'}
            companyLogoPath={company?.logoUrl ?? null}
            companyDetails={
              company
                ? {
                    email: company.email,
                    phone: company.phone,
                    address: company.address,
                    website: company.website,
                    vatNumber: company.vatNumber,
                    bankName: company.bankName,
                    accountName: company.accountName,
                    accountNumber: company.accountNumber,
                    branchCode: company.branchCode,
                    accountType: company.accountType,
                  }
                : null
            }
            draft={draft}
            client={{
              name: String(client.name ?? '—'),
              email: client.email ?? null,
              phone: client.phone ?? null,
              address: client.address ?? null,
              companyName: (client as any).company_name ?? (client as any).companyName ?? null,
              website: (client as any).website ?? null,
              companyRegistration: (client as any).company_registration ?? (client as any).companyRegistration ?? null,
              vatNumber: (client as any).vat_number ?? (client as any).vatNumber ?? null,
            }}
            showPoweredBy={poweredBy}
            invoiceViewUrl={invoiceViewUrl}
          />
        </div>
      </div>
    </div>
  );
}
