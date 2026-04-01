'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { convertQuoteOnServer, fetchQuoteDetail } from '@/features/quotes/api';
import type { QuoteDetail } from '@/features/quotes/types';
import { Skeleton } from '@/components/ui/Skeleton';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any).id);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const q = await fetchQuoteDetail(id);
        if (!alive) return;
        setQuote(q);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load quote.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <AppShell
      title={quote?.quoteNumber ? `Quote ${quote.quoteNumber}` : 'Quote'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href={routes.app.quotes}>
            <Button variant="secondary">Back</Button>
          </Link>
          {quote && quote.status !== 'converted' ? (
            <Button
              disabled={converting}
              onClick={async () => {
                setConverting(true);
                setError(null);
                try {
                  const { invoiceId } = await convertQuoteOnServer(id);
                  router.push(`${routes.app.invoices}/${invoiceId}`);
                } catch (e: any) {
                  setError(e?.message ?? 'Convert failed.');
                } finally {
                  setConverting(false);
                }
              }}
            >
              {converting ? 'Converting…' : 'Convert to invoice'}
            </Button>
          ) : quote?.convertedInvoiceId ? (
            <Link href={`${routes.app.invoices}/${quote.convertedInvoiceId}`}>
              <Button variant="secondary">Open invoice</Button>
            </Link>
          ) : null}
        </div>
      }
    >
      <Card className="p-5">
        {error ? <div className="mb-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : quote ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-muted px-3 py-1 font-medium capitalize">{quote.status}</span>
              <span className="text-muted-foreground">Issued {quote.issueDate}</span>
              <span className="text-muted-foreground">Valid {quote.validUntil}</span>
            </div>
            {quote.notes ? <div className="rounded-2xl bg-muted/20 p-3 text-sm">{quote.notes}</div> : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="border-b border-border px-2 py-2">Item</th>
                    <th className="border-b border-border px-2 py-2 text-right">Qty</th>
                    <th className="border-b border-border px-2 py-2 text-right">Price</th>
                    <th className="border-b border-border px-2 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((it) => (
                    <tr key={it.id}>
                      <td className="border-b border-border px-2 py-2">{it.description}</td>
                      <td className="border-b border-border px-2 py-2 text-right tabular-nums">{it.quantity}</td>
                      <td className="border-b border-border px-2 py-2 text-right tabular-nums">
                        {formatMoney(it.unitPrice, quote.currency)}
                      </td>
                      <td className="border-b border-border px-2 py-2 text-right font-medium tabular-nums">
                        {formatMoney(it.lineTotal, quote.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end text-lg font-semibold">
              Total {formatMoney(quote.totalAmount, quote.currency)}
            </div>
          </div>
        ) : null}
      </Card>
    </AppShell>
  );
}
