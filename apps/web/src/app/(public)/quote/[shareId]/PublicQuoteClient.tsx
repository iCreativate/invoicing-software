'use client';

import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/format/money';
import { Button } from '@/components/ui/Button';

type PublicQuote = {
  id: string;
  quoteNumber: string | null;
  status: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  totalAmount: number;
  notes: string | null;
  companyName: string;
  clientName: string | null;
  items: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
};

export function PublicQuoteClient({ shareId, initial }: { shareId: string; initial: PublicQuote }) {
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
      setQuote((q) => ({ ...q, status: String(json.data?.status ?? action === 'accept' ? 'accepted' : 'declined') }));
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">TIMELY</div>
      <p className="mt-3 text-sm text-muted-foreground">Quote from</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{quote.companyName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {quote.quoteNumber ?? 'Quote'} · Valid until {quote.validUntil}
      </p>

      <div className="mt-8 border-t border-border pt-6">
        <div className="ti-metric-display text-foreground">{formatMoney(quote.totalAmount, quote.currency)}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Status: <span className="font-medium capitalize text-foreground">{quote.status}</span>
        </p>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-muted-foreground">
              <th className="border-b border-border py-2 pr-2">Item</th>
              <th className="border-b border-border py-2 text-right">Qty</th>
              <th className="border-b border-border py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((it, i) => (
              <tr key={i}>
                <td className="border-b border-border/60 py-2 pr-2">{it.description}</td>
                <td className="border-b border-border/60 py-2 text-right tabular-nums">{it.quantity}</td>
                <td className="border-b border-border/60 py-2 text-right tabular-nums">
                  {formatMoney(it.lineTotal, quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {quote.notes ? <p className="mt-6 text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p> : null}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {!final ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => void respond('accept')}>
            {busy ? 'Working…' : 'Accept quote'}
          </Button>
          <Button disabled={busy} variant="secondary" onClick={() => void respond('decline')}>
            Decline
          </Button>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          This quote has been {quote.status}. The business will follow up if needed.
        </p>
      )}
    </div>
  );
}
