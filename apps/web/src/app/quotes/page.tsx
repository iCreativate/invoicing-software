'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody, PageMain } from '@/components/layout/PageLayout';
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
      <PageBody>
      <PageMain className="flex min-h-0 flex-1 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Proposals</div>
            <div className="mt-1 text-sm text-muted-foreground">Convert accepted quotes to invoices in one click.</div>
          </div>
          <div className="w-full sm:max-w-xs">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotes…" aria-label="Search quotes" />
          </div>
        </div>

        {error ? <div className="mt-4 rounded-[var(--ti-radius)] border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-[var(--ti-radius)] border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No quotes yet. Create a quote to send pricing before invoicing.
          </div>
        ) : (
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-[var(--ti-radius)] border border-border">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead className="sticky top-0 z-[1] bg-card">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="border-b border-border px-3 py-2.5">Quote</th>
                  <th className="border-b border-border px-3 py-2.5">Client</th>
                  <th className="border-b border-border px-3 py-2.5">Status</th>
                  <th className="border-b border-border px-3 py-2.5 text-right">Total</th>
                  <th className="border-b border-border px-3 py-2.5 text-right">Valid until</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="ti-row-hover">
                    <td className="border-b border-border px-3 py-2.5 font-medium">
                      <Link className="text-[var(--ti-brand-accent,#2F6F7E)] underline-offset-4 hover:underline" href={`${routes.app.quotes}/${q.id}`}>
                        {q.quoteNumber ?? '—'}
                      </Link>
                    </td>
                    <td className="border-b border-border px-3 py-2.5">{q.clientName ?? '—'}</td>
                    <td className="border-b border-border px-3 py-2.5 capitalize">
                      <span className="rounded-[var(--ti-radius-sm)] bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {q.status}
                      </span>
                    </td>
                    <td className="ti-num border-b border-border px-3 py-2.5 text-right">{formatMoney(q.totalAmount, q.currency)}</td>
                    <td className="border-b border-border px-3 py-2.5 text-right text-muted-foreground">{q.validUntil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </PageMain>

      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import quotes"
        description="Upload CSV, Excel, PDF, or an image. From PDF/image we OCR text and look for comma-, tab-, or semicolon-separated columns. Each row needs client_email (existing client), quote_number, issue_date, valid_until, line description, quantity, unit_price. Optional: currency, tax_rate, notes."
        endpoint="/api/quotes/import"
        templateHref="/import-templates/timely-quotes.csv"
        onSuccess={() => void loadQuotes()}
      />
      </PageBody>
    </AppShell>
  );
}
