'use client';

import { useEffect, useState } from 'react';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { Button } from '@/components/ui/Button';
import type { InvoiceComposerDraft } from '@/components/invoice/composer/types';
import type { InvoicePreviewCompanyDetails } from '@/features/company/previewDetails';

type PublicQuotePayload = {
  id: string;
  quoteNumber: string | null;
  status: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  notes: string | null;
  companyName: string;
  companyLogoPath: string | null;
  companyDetails: InvoicePreviewCompanyDetails | null;
  showPoweredBy: boolean;
  shareUrl: string;
  clientName: string | null;
  draft: InvoiceComposerDraft;
};

export function PublicQuoteClient({ shareId, initial }: { shareId: string; initial: PublicQuotePayload }) {
  const [quote, setQuote] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const final = ['accepted', 'declined', 'converted'].includes(quote.status);

  useEffect(() => {
    void fetch('/api/quotes/public-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId }),
    }).catch(() => undefined);
  }, [shareId]);

  async function respond(action: 'accept' | 'decline') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/quotes/public-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Request failed');
      setQuote((q) => ({ ...q, status: String(json.data?.status ?? (action === 'accept' ? 'accepted' : 'declined')) }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] p-4 sm:p-10">
      <div className="mx-auto max-w-4xl motion-safe:animate-[ti-fade-up_0.45s_ease-out_both]">
        <InvoicePreview
          documentKind="quote"
          companyName={quote.companyName}
          companyLogoPath={quote.companyLogoPath}
          companyDetails={quote.companyDetails}
          draft={quote.draft}
          client={{ name: quote.clientName ?? '—' }}
          showPoweredBy={quote.showPoweredBy}
          invoiceViewUrl={quote.shareUrl}
        />

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        {!final ? (
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <Button disabled={busy} onClick={() => void respond('accept')}>
              {busy ? 'Working…' : 'Accept quote'}
            </Button>
            <Button disabled={busy} variant="secondary" onClick={() => void respond('decline')}>
              Decline
            </Button>
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground print:hidden">
            This quote has been {quote.status}. The business will follow up if needed.
          </p>
        )}
      </div>
    </div>
  );
}
