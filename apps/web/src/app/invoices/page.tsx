'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { fetchInvoicesList } from '@/features/invoices/api';
import { getInvoiceStatusClasses, getInvoiceStatusLabel } from '@/features/invoices/status';
import type { InvoiceListItem } from '@/features/invoices/types';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
import { PayNowButton } from '@/components/payments/PayNowButton';

function StatusPill({ status }: { status: InvoiceListItem['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getInvoiceStatusClasses(status)}`}>
      {getInvoiceStatusLabel(status)}
    </span>
  );
}

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchInvoicesList();
        if (!alive) return;
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load invoices. Ensure Supabase tables exist.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const draftKey = 'ti_invoice_draft_v1:modal';
  const hasDraft = useMemo(() => {
    try {
      return !!localStorage.getItem(draftKey);
    } catch {
      return false;
    }
  }, [loading]); // re-evaluate after initial render

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((inv) => {
      const hay = `${inv.invoice_number} ${inv.client_name ?? ''} ${inv.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  return (
    <AppShell
      title="Invoices"
      actions={
        <div className="flex items-center gap-2">
          {hasDraft ? (
            <Link href={`${routes.app.invoices}/new`} className="text-sm font-semibold text-primary hover:underline">
              Resume draft
            </Link>
          ) : null}
          <InvoiceComposerLauncher />
        </div>
      }
    >
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">All invoices</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {loading ? 'Loading…' : `${filtered.length} invoice(s)`}
            </div>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice #, client, status…" />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            No invoices yet. Create your first invoice.
            <div className="mt-3">
              <InvoiceComposerLauncher />
            </div>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <>
            <div className="mt-4 space-y-3 md:hidden">
              {filtered.map((inv) => {
                const canPay = Number(inv.balance_amount ?? 0) > 0 && String(inv.status ?? '') !== 'paid';
                return (
                  <Card key={inv.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`${routes.app.invoices}/${inv.id}`} className="font-semibold hover:underline">
                          {inv.invoice_number || inv.id.slice(0, 8)}
                        </Link>
                        <div className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-300">{inv.client_name ?? '—'}</div>
                      </div>
                      <StatusPill status={inv.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-zinc-500">Total</div>
                        <div className="font-semibold tabular-nums">{formatMoney(inv.total_amount, inv.currency)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-500">Balance</div>
                        <div className="font-semibold tabular-nums">{formatMoney(inv.balance_amount, inv.currency)}</div>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <PayNowButton invoiceId={inv.id} disabled={!canPay} compact label="Pay now" />
                    </div>
                  </Card>
                );
              })}
            </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <th className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">Invoice</th>
                  <th className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">Client</th>
                  <th className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">Status</th>
                  <th className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">Issue</th>
                  <th className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">Due</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-right dark:border-zinc-800">Total</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-right dark:border-zinc-800">Balance</th>
                  <th className="border-b border-zinc-200 px-3 py-2 text-right dark:border-zinc-800">Pay</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="text-sm">
                    <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                      <Link href={`${routes.app.invoices}/${inv.id}`} className="font-semibold hover:underline">
                        {inv.invoice_number || inv.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 text-zinc-700 dark:border-zinc-900 dark:text-zinc-200">
                      {inv.client_name ?? '—'}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                      <StatusPill status={inv.status} />
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 text-zinc-700 dark:border-zinc-900 dark:text-zinc-200">
                      {inv.issue_date || '—'}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 text-zinc-700 dark:border-zinc-900 dark:text-zinc-200">
                      {inv.due_date || '—'}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 text-right font-semibold dark:border-zinc-900">
                      {formatMoney(inv.total_amount, inv.currency)}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 text-right font-semibold dark:border-zinc-900">
                      {formatMoney(inv.balance_amount, inv.currency)}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 text-right align-top dark:border-zinc-900">
                      <div className="ml-auto flex justify-end">
                        <PayNowButton
                          invoiceId={inv.id}
                          disabled={!(Number(inv.balance_amount ?? 0) > 0) || String(inv.status ?? '') === 'paid'}
                          compact
                          label="Pay"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : null}
      </Card>
    </AppShell>
  );
}

