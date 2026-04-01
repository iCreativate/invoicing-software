'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { fetchPaymentsList } from '@/features/payments/api';

type Row = Awaited<ReturnType<typeof fetchPaymentsList>>[number];

function methodLabel(m: string) {
  return m
    .split('_')
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function PaymentsClient() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchPaymentsList({ limit: 50 });
        if (!alive) return;
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load payments. Ensure Supabase tables exist.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => {
      const hay = `${p.invoiceNumber ?? ''} ${p.clientName ?? ''} ${p.method} ${p.notes ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const totals = useMemo(() => {
    const completed = filtered.filter((p) => p.status === 'completed');
    const sum = completed.reduce((s, p) => s + p.amount, 0);
    const currency = completed[0]?.currency ?? 'ZAR';
    return { sum, currency, count: completed.length };
  }, [filtered]);

  return (
    <AppShell
      title="Payments"
      actions={
        <Link href={routes.app.invoices}>
          <Button variant="secondary">Record a payment</Button>
        </Link>
      }
    >
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Recent payments</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${filtered.length} payment(s)`}
              </div>
            </div>
            <div className="w-full sm:max-w-sm">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice, client, notes…" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-xs font-semibold text-muted-foreground">Completed (filtered)</div>
              <div className="mt-2 text-xl font-semibold tabular-nums">
                {formatMoney(totals.sum, totals.currency)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{totals.count} payment(s)</div>
            </div>
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-xs font-semibold text-muted-foreground">How to record</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Open an invoice → <span className="font-semibold text-foreground">Payments</span> → record payment.
              </div>
            </div>
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-xs font-semibold text-muted-foreground">Tip</div>
              <div className="mt-2 text-sm text-muted-foreground">
                Add notes like “EFT ref: 1234” so you can find it later.
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-muted-foreground dark:border-zinc-800">
              No payments yet. Record a payment from an invoice’s payments page.
              <div className="mt-3">
                <Link href={routes.app.invoices}>
                  <Button>Go to invoices</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[860px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="border-b border-border px-3 py-2">Date</th>
                    <th className="border-b border-border px-3 py-2">Invoice</th>
                    <th className="border-b border-border px-3 py-2">Client</th>
                    <th className="border-b border-border px-3 py-2">Method</th>
                    <th className="border-b border-border px-3 py-2">Status</th>
                    <th className="border-b border-border px-3 py-2 text-right">Amount</th>
                    <th className="border-b border-border px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="text-sm">
                      <td className="border-b border-zinc-100 px-3 py-3 tabular-nums dark:border-zinc-900">
                        {p.payment_date || '—'}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 font-semibold dark:border-zinc-900">
                        <Link className="hover:underline" href={`${routes.app.invoices}/${p.invoiceId}`}>
                          {p.invoiceNumber ?? 'View invoice'}
                        </Link>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        {p.clientName ?? '—'}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        {methodLabel(p.method)}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                        <Badge variant={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'danger' : 'outline'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 text-right tabular-nums font-semibold dark:border-zinc-900">
                        {formatMoney(p.amount, p.currency)}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-3 text-muted-foreground dark:border-zinc-900">
                        {p.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}

