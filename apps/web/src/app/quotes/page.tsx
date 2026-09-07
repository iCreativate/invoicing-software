'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { Amount } from '@/components/ui/Text';
import { PageSummary } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { convertQuoteOnServer, fetchQuotesList } from '@/features/quotes/api';
import type { QuoteListItem } from '@/features/quotes/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { FileImportDialog } from '@/components/import/FileImportDialog';
import { MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { notifyError, notifySuccess } from '@/lib/notify';
import { Search, Upload, FileText, TrendingUp, CheckCircle, FilePenLine } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
] as const;

type StatusView = (typeof STATUS_PILLS)[number]['value'];

function quoteTone(status: string): 'paid' | 'overdue' | 'draft' | 'open' {
  const s = status.toLowerCase();
  if (s === 'accepted' || s === 'converted') return 'paid';
  if (s === 'declined') return 'overdue';
  if (s === 'sent') return 'open';
  return 'draft';
}

function quoteStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'accepted' || s === 'converted') return 'ti-status-paid';
  if (s === 'declined') return 'ti-status-overdue';
  if (s === 'sent') return 'ti-status-sent';
  return 'ti-status-draft';
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export default function QuotesPage() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QuoteListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusView, setStatusView] = useState<StatusView>('all');
  const [importOpen, setImportOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

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

  const metrics = useMemo(() => {
    const currency = items[0]?.currency ?? 'ZAR';
    let pipeline = 0;
    let accepted = 0;
    let drafts = 0;
    let sent = 0;
    for (const q of items) {
      const s = q.status.toLowerCase();
      if (s === 'draft') drafts += 1;
      if (s === 'sent') {
        sent += 1;
        pipeline += q.totalAmount;
      }
      if (s === 'accepted' || s === 'converted') accepted += q.totalAmount;
      if (s !== 'declined' && s !== 'converted' && s !== 'draft') {
        // keep pipeline as open sent quotes only
      }
    }
    return { currency, pipeline, accepted, drafts, sent, total: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      if (statusView !== 'all' && x.status.toLowerCase() !== statusView) return false;
      if (!q) return true;
      return (
        (x.quoteNumber ?? '').toLowerCase().includes(q) ||
        (x.clientName ?? '').toLowerCase().includes(q) ||
        x.status.toLowerCase().includes(q)
      );
    });
  }, [items, query, statusView]);

  const convertQuote = async (id: string) => {
    setConvertingId(id);
    try {
      const { invoiceId } = await convertQuoteOnServer(id);
      notifySuccess('Quote converted to an invoice.');
      window.location.href = `${routes.app.invoices}/${invoiceId}/edit`;
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Could not convert quote.');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <MoneyWorkspace
      actions={
        canMutate ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button asChild size="sm">
              <Link href={`${routes.app.quotes}/new`}>New quote</Link>
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        <PageSummary>
          <MoneyKpiGrid>
            <MoneyKpiCard
              icon={FileText}
              label="Quotes"
              value={metrics.total}
              trend="In this workspace"
              active={statusView === 'all'}
              onClick={() => setStatusView('all')}
            />
            <MoneyKpiCard
              icon={TrendingUp}
              label="Pipeline"
              value={formatMoney(metrics.pipeline, metrics.currency)}
              trend={`${metrics.sent} sent`}
              active={statusView === 'sent'}
              onClick={() => setStatusView('sent')}
            />
            <MoneyKpiCard
              icon={CheckCircle}
              label="Accepted"
              value={formatMoney(metrics.accepted, metrics.currency)}
              trend="Won value"
              trendUp
              active={statusView === 'accepted'}
              onClick={() => setStatusView('accepted')}
            />
            <MoneyKpiCard
              icon={FilePenLine}
              label="Drafts"
              value={metrics.drafts}
              trend="Ready to send"
              active={statusView === 'draft'}
              onClick={() => setStatusView('draft')}
            />
          </MoneyKpiGrid>
        </PageSummary>

        <Surface variant="elevated" className="ti-panel ti-invoice-ledger flex min-h-0 flex-1 flex-col">
          <div className="ti-panel-head">
            <SectionHeader
              kicker="Ledger"
              title={`${filtered.length} quote${filtered.length === 1 ? '' : 's'}`}
              description="Quote → Accepted → Invoice → Payment"
            />
          </div>

          <div className="ti-invoice-toolbar mt-1">
            <Tabs
              items={STATUS_PILLS.map((p) => ({ value: p.value, label: p.label }))}
              value={statusView}
              onChange={(v) => setStatusView(v as StatusView)}
            />
            <div className="relative sm:min-w-[14rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--tl-ink-3)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search number or client"
                className="pl-9"
                aria-label="Search quotes"
              />
            </div>
          </div>

          {error ? (
            <div className="ti-error mt-4" role="alert">
              <div className="font-medium">Couldn’t load quotes</div>
              <p className="ti-error-body">{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 space-y-0" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                kicker={items.length === 0 ? 'No quotes' : 'No matches'}
                title={items.length === 0 ? 'Send pricing before you invoice.' : 'No quotes match these filters.'}
                description={
                  items.length === 0
                    ? 'Create a quote, get it accepted, then convert to an invoice.'
                    : 'Try a different status or search term.'
                }
                action={
                  canMutate && items.length === 0 ? (
                    <Button asChild>
                      <Link href={`${routes.app.quotes}/new`}>New quote</Link>
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((q) => {
                  const canConvert =
                    canMutate &&
                    !q.convertedInvoiceId &&
                    q.status.toLowerCase() !== 'declined' &&
                    q.status.toLowerCase() !== 'converted';
                  return (
                    <div key={q.id} className="ti-invoice-card" data-tone={quoteTone(q.status)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`${routes.app.quotes}/${q.id}`}
                            className="ti-invoice-number hover:underline"
                          >
                            {q.quoteNumber ?? '—'}
                          </Link>
                          <div className="ti-invoice-client mt-1">{q.clientName ?? '—'}</div>
                          <div className="ti-invoice-meta">Valid until {formatDate(q.validUntil)}</div>
                        </div>
                        <span className={cn('ti-status capitalize', quoteStatusClass(q.status))}>{q.status}</span>
                      </div>
                      <div className="ti-invoice-amount">{formatMoney(q.totalAmount, q.currency)}</div>
                      <div className="flex items-center justify-between border-t border-[var(--tl-line)] pt-3 text-[13px] font-medium">
                        <Link href={`${routes.app.quotes}/${q.id}`} className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]">
                          View
                        </Link>
                        {q.convertedInvoiceId ? (
                          <Link
                            href={`${routes.app.invoices}/${q.convertedInvoiceId}`}
                            className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
                          >
                            Open invoice
                          </Link>
                        ) : canConvert ? (
                          <button
                            type="button"
                            className="text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)] disabled:opacity-50"
                            disabled={convertingId === q.id}
                            onClick={() => void convertQuote(q.id)}
                          >
                            {convertingId === q.id
                              ? 'Converting…'
                              : q.status.toLowerCase() === 'accepted'
                                ? 'Convert to invoice'
                                : 'Convert'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 hidden min-h-0 flex-1 overflow-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Quote</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Valid until</TableHead>
                      <TableHead className="w-36 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((q) => {
                      const canConvert =
                        canMutate &&
                        !q.convertedInvoiceId &&
                        q.status.toLowerCase() !== 'declined' &&
                        q.status.toLowerCase() !== 'converted';
                      return (
                        <TableRow key={q.id} className="group" data-tone={quoteTone(q.status)}>
                          <TableCell>
                            <Link
                              href={`${routes.app.quotes}/${q.id}`}
                              className="ti-invoice-number hover:underline"
                            >
                              {q.quoteNumber ?? '—'}
                            </Link>
                            <div className="ti-invoice-meta">Issued {formatDate(q.issueDate)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="ti-invoice-client">{q.clientName ?? '—'}</div>
                          </TableCell>
                          <TableCell>
                            <span className={cn('ti-status capitalize', quoteStatusClass(q.status))}>
                              {q.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="ti-invoice-amount">{formatMoney(q.totalAmount, q.currency)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="ti-invoice-due">{formatDate(q.validUntil)}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {q.convertedInvoiceId ? (
                              <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-[12.5px]">
                                <Link href={`${routes.app.invoices}/${q.convertedInvoiceId}`}>Open invoice</Link>
                              </Button>
                            ) : canConvert ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-[12.5px]"
                                disabled={convertingId === q.id}
                                onClick={() => void convertQuote(q.id)}
                              >
                                {convertingId === q.id
                                  ? 'Converting…'
                                  : q.status.toLowerCase() === 'accepted'
                                    ? 'Convert'
                                    : 'Convert'}
                              </Button>
                            ) : (
                              <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-[12.5px]">
                                <Link href={`${routes.app.quotes}/${q.id}`}>View</Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </Surface>
      </div>

      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import quotes"
        description="Upload CSV, Excel, PDF, or an image. From PDF/image we OCR text and look for comma-, tab-, or semicolon-separated columns. Each row needs client_email (existing client), quote_number, issue_date, valid_until, line description, quantity, unit_price. Optional: currency, tax_rate, notes."
        endpoint="/api/quotes/import"
        templateHref="/import-templates/timely-quotes.csv"
        onSuccess={() => void loadQuotes()}
      />
    </MoneyWorkspace>
  );
}
