'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import type { InvoiceComposerDraft } from '@/components/invoice/composer/types';
import { fetchMyCompanyProfile, subscriptionShowsPoweredBy } from '@/features/company/api';
import { mapCompanyProfileToPreviewDetails } from '@/features/company/previewDetails';
import { fetchQuoteDetail } from '@/features/quotes/api';
import type { QuoteDetail } from '@/features/quotes/types';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';

function quoteToPreviewDraft(quote: QuoteDetail): InvoiceComposerDraft {
  return {
    invoiceNumber: quote.quoteNumber,
    clientId: quote.clientId,
    issueDate: quote.issueDate,
    dueDate: quote.validUntil,
    currency: quote.currency,
    template: 'modern',
    notes: quote.notes ?? undefined,
    items: quote.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      vatRate: it.vatRate,
    })),
  };
}

export default function QuotePrintPage() {
  const params = useParams();
  const id = String((params as { id?: string }).id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [company, setCompany] = useState<Awaited<ReturnType<typeof fetchMyCompanyProfile>> | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const [q, co] = await Promise.all([fetchQuoteDetail(id), fetchMyCompanyProfile()]);
        if (!alive) return;
        if (!q) throw new Error('Quote not found');
        setQuote(q);
        setCompany(co);
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const draft = useMemo(() => (quote ? quoteToPreviewDraft(quote) : null), [quote]);

  useEffect(() => {
    if (!quote) return;
    const t = window.setTimeout(() => window.print(), 1000);
    return () => window.clearTimeout(t);
  }, [quote]);

  if (error) {
    return (
      <div className="min-h-dvh bg-background p-8 text-center text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!quote || !draft) {
    return <div className="min-h-dvh bg-background p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const poweredBy = subscriptionShowsPoweredBy(company?.subscriptionPlan ?? null);
  const quoteViewUrl =
    quote.publicShareId && typeof window !== 'undefined'
      ? `${window.location.origin}/quote/${quote.publicShareId}`
      : undefined;

  return (
    <div className="min-h-dvh bg-background p-4 print:p-0">
      <div className="mx-auto max-w-4xl print:max-w-none">
        <div className="mb-4 flex justify-end print:hidden">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
        <div className="ti-print-area">
          <InvoicePreview
            companyName={company?.companyName ?? 'TimelyInvoices'}
            companyLogoPath={company?.logoUrl ?? null}
            companyDetails={mapCompanyProfileToPreviewDetails(company)}
            draft={draft}
            client={{
              name: quote.clientName ?? '—',
              email: quote.clientEmail ?? null,
              phone: quote.clientPhone ?? null,
              address: quote.clientAddress ?? null,
              companyName: quote.clientCompanyName ?? null,
            }}
            showPoweredBy={poweredBy}
            invoiceViewUrl={quoteViewUrl}
            documentKind="quote"
          />
        </div>
      </div>
    </div>
  );
}
