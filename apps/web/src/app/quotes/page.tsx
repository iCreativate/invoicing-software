'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { fetchQuotesList } from '@/features/quotes/api';
import type { QuoteListItem } from '@/features/quotes/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { FileImportDialog } from '@/components/import/FileImportDialog';
import { Upload } from 'lucide-react';

export default function QuotesPage() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QuoteListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchQuotesList();
      setItems(list);
    } catch (e: unknown) {
      setError(String((e as { message?: string })?.message ?? 'Failed to load quotes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) =>
        (x.quoteNumber ?? '').toLowerCase().includes(q) ||
        (x.clientName ?? '').toLowerCase().includes(q) ||
        x.status.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <AppShell
      title="Quotes"
      actions={
        canMutate ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Link href={`${routes.app.quotes}/new`}>
              <Button>New quote</Button>
            </Link>
          </div>
        ) : null
      }
    >
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Proposals</div>
            <div className="mt-1 text-sm text-muted-foreground">Convert accepted quotes to invoices in one click.</div>
          </div>
          <div className="w-full sm:max-w-xs">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotes…" aria-label="Search quotes" />
          </div>
        </div>

        {error ? <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No quotes yet. Create a quote to send pricing before invoicing.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="border-b border-border px-3 py-2">Quote</th>
                  <th className="border-b border-border px-3 py-2">Client</th>
                  <th className="border-b border-border px-3 py-2">Status</th>
                  <th className="border-b border-border px-3 py-2 text-right">Total</th>
                  <th className="border-b border-border px-3 py-2 text-right">Valid until</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="motion-safe:transition-colors hover:bg-muted/30">
                    <td className="border-b border-border px-3 py-3 font-medium">
                      <Link className="text-primary underline-offset-4 hover:underline" href={`${routes.app.quotes}/${q.id}`}>
                        {q.quoteNumber ?? '—'}
                      </Link>
                    </td>
                    <td className="border-b border-border px-3 py-3">{q.clientName ?? '—'}</td>
                    <td className="border-b border-border px-3 py-3 capitalize">{q.status}</td>
                    <td className="border-b border-border px-3 py-3 text-right tabular-nums">{formatMoney(q.totalAmount, q.currency)}</td>
                    <td className="border-b border-border px-3 py-3 text-right text-muted-foreground">{q.validUntil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import quotes"
        description="Upload CSV, Excel, PDF, or an image. From PDF/image we OCR text and look for comma-, tab-, or semicolon-separated columns. Each row needs client_email (existing client), quote_number, issue_date, valid_until, line description, quantity, unit_price. Optional: currency, tax_rate, notes."
        endpoint="/api/quotes/import"
        templateHref="/import-templates/timely-quotes.csv"
        onSuccess={() => void loadQuotes()}
      />
    </AppShell>
  );
}
