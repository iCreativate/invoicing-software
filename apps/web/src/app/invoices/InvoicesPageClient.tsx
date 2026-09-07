'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PageActions, PageSummary } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import type { InvoiceListItem, InvoiceStatus } from '@/features/invoices/types';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { fetchClientsList } from '@/features/clients/api';
import type { ClientListItem } from '@/features/clients/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { demoInvoicesList } from '@/lib/demo/fixtures';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { notifyError, notifySuccess } from '@/lib/notify';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Bell,
  CheckCircle,
  Download,
  ArrowDownWideNarrow,
  Search,
  Wallet,
  AlertCircle,
  Banknote,
  FilePenLine,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Input';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { Amount } from '@/components/ui/Text';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { loadDraft, INVOICE_AUTOSAVE_SCOPE_PAGE } from '@/components/invoice/composer/autosave';
import { discardPersistedDraft, loadPersistedDraft } from '@/components/invoice/composer/composerPersistence';
import { FileImportDialog } from '@/components/import/FileImportDialog';
import { MONEY_INVOICE_SUBNAV, MoneySubNav, MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { cn } from '@/lib/utils/cn';

const STATUS_PILLS: { value: 'all' | InvoiceStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const OPEN_STATUSES = new Set<InvoiceStatus>(['sent', 'viewed', 'partial', 'overdue']);

function parseInvoiceStatus(raw: string | null): 'all' | InvoiceStatus {
  if (raw && STATUS_PILLS.some((p) => p.value === raw)) return raw as 'all' | InvoiceStatus;
  return 'all';
}

function formatDue(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function dueMeta(iso: string | null | undefined, status: InvoiceStatus) {
  if (!iso || status === 'paid' || status === 'cancelled' || status === 'draft') return null;
  const due = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueStart = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const days = Math.round((dueStart - start) / 86400000);
  if (status === 'overdue' || days < 0) {
    const n = Math.abs(days);
    return { label: n === 0 ? 'Due today' : `${n}d overdue`, overdue: true };
  }
  if (days === 0) return { label: 'Due today', overdue: false };
  if (days === 1) return { label: 'Due tomorrow', overdue: false };
  if (days <= 7) return { label: `In ${days} days`, overdue: false };
  return null;
}

function rowTone(status: InvoiceStatus): 'paid' | 'overdue' | 'draft' | 'open' {
  if (status === 'paid') return 'paid';
  if (status === 'overdue') return 'overdue';
  if (status === 'draft' || status === 'cancelled') return 'draft';
  return 'open';
}

export function InvoicesPageClient() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [items, setItems] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [statusView, setStatusView] = useState<'all' | InvoiceStatus>(() => parseInvoiceStatus(searchParams.get('status')));
  const [clientId, setClientId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [sortAmountDesc, setSortAmountDesc] = useState(true);

  const [pageDraft, setPageDraft] = useState<ReturnType<typeof loadDraft>>(null);

  useEffect(() => {
    setStatusView(parseInvoiceStatus(searchParams.get('status')));
  }, [searchParams]);

  const onStatusView = useCallback(
    (value: 'all' | InvoiceStatus) => {
      setStatusView(value);
      const next = new URLSearchParams(searchParams.toString());
      if (value === 'all') next.delete('status');
      else next.set('status', value);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const refreshPageDraft = useCallback(async () => {
    try {
      const resolved = await loadPersistedDraft(INVOICE_AUTOSAVE_SCOPE_PAGE);
      setPageDraft(resolved);
    } catch {
      setPageDraft(loadDraft(INVOICE_AUTOSAVE_SCOPE_PAGE));
    }
  }, []);

  useEffect(() => {
    refreshPageDraft();
    const onDraftEvent = () => refreshPageDraft();
    window.addEventListener('ti-invoice-draft-changed', onDraftEvent);
    window.addEventListener('focus', onDraftEvent);
    return () => {
      window.removeEventListener('ti-invoice-draft-changed', onDraftEvent);
      window.removeEventListener('focus', onDraftEvent);
    };
  }, [refreshPageDraft]);

  const draftClientLabel = useMemo(() => {
    const id = pageDraft?.draft?.clientId?.trim();
    if (!id) return 'No client selected yet';
    const c = clients.find((x) => x.id === id);
    return c?.name ?? 'Saved client — open resume to continue';
  }, [clients, pageDraft]);

  const loadInvoices = useCallback(async () => {
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (isDemoUiActive()) {
      let list = demoInvoicesList();
      if (clientId) list = list.filter((i) => i.client_id === clientId);
      setItems(list);
      return;
    }
    const res = await fetch(`/api/invoices?${params.toString()}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to load invoices');
    setItems(Array.isArray(json.data?.invoices) ? (json.data.invoices as InvoiceListItem[]) : []);
  }, [clientId, dateFrom, dateTo]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadInvoices();
        const cl = await fetchClientsList();
        if (!alive) return;
        setClients(cl);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadInvoices]);

  useEffect(() => {
    if (isDemoUiActive()) return;
    let ch: { unsubscribe?: () => void } | null = null;
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        const ownerId = await getWorkspaceOwnerIdForClient();
        ch = supabase
          .channel(`invoices-list-${ownerId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'invoices', filter: `owner_id=eq.${ownerId}` },
            () => {
              void loadInvoices().catch(() => {});
            }
          )
          .subscribe();
      } catch {
        // ignore realtime if not signed in
      }
    })();
    return () => {
      if (ch) supabase.removeChannel(ch as any);
    };
  }, [loadInvoices]);

  const metrics = useMemo(() => {
    const currency = items[0]?.currency ?? 'ZAR';
    let outstanding = 0;
    let overdue = 0;
    let paid = 0;
    let drafts = 0;
    for (const inv of items) {
      if (inv.status === 'draft') drafts += 1;
      if (inv.status === 'paid') paid += inv.total_amount;
      if (inv.status === 'overdue') overdue += inv.balance_amount;
      if (OPEN_STATUSES.has(inv.status)) outstanding += inv.balance_amount;
    }
    return {
      currency,
      outstanding,
      overdue,
      paid,
      drafts,
      openCount: items.filter((i) => OPEN_STATUSES.has(i.status)).length,
      total: items.length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = statusView === 'all' ? items : items.filter((inv) => inv.status === statusView);
    if (q) {
      base = base.filter((inv) => {
        const hay = `${inv.invoice_number} ${inv.client_name ?? ''} ${inv.status}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return [...base].sort((a, b) =>
      sortAmountDesc ? b.total_amount - a.total_amount : a.total_amount - b.total_amount
    );
  }, [items, query, sortAmountDesc, statusView]);

  const noInvoicesAtAll =
    !loading && items.length === 0 && !clientId && !query.trim() && !dateFrom && !dateTo;

  const hasPageDraft = Boolean(pageDraft?.draft);
  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCsv = (rows: InvoiceListItem[]) => {
    const header = ['invoice_number', 'client', 'amount', 'status', 'due_date', 'currency'];
    const lines = [
      header.join(','),
      ...rows.map((inv) =>
        [
          JSON.stringify(inv.invoice_number || inv.id.slice(0, 8)),
          JSON.stringify(inv.client_name ?? ''),
          inv.total_amount,
          inv.status,
          inv.due_date,
          inv.currency,
        ].join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const runBulkRemind = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/invoices/bulk-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: ids }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Bulk remind failed');
      const detail = json.data.errors?.length ? ` Skipped: ${json.data.errors.join('; ')}` : '';
      notifySuccess(`Sent ${json.data.sent} reminder(s).${detail}`);
    } catch (e: any) {
      notifyError(e?.message ?? 'Bulk remind failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const rowAction = async (inv: InvoiceListItem, action: string) => {
    setBusyId(inv.id);
    try {
      if (action === 'delete') {
        if (!confirm(`Delete invoice ${inv.invoice_number || inv.id.slice(0, 8)}?`)) {
          setBusyId(null);
          return;
        }
        const res = await fetch(`/api/invoices/${inv.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? 'Delete failed');
        await loadInvoices();
        setSelected((s) => {
          const n = new Set(s);
          n.delete(inv.id);
          return n;
        });
        notifySuccess('Invoice deleted.');
      } else if (action === 'duplicate') {
        const res = await fetch(`/api/invoices/${inv.id}/duplicate`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? 'Duplicate failed');
        await loadInvoices();
        notifySuccess('Opening duplicate for editing…');
        window.location.href = `${routes.app.invoices}/${json.data.id}/edit`;
      } else if (action === 'paid') {
        const res = await fetch(`/api/invoices/${inv.id}/mark-paid`, { method: 'POST' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? 'Mark paid failed');
        await loadInvoices();
        notifySuccess('Marked as paid.');
      }
    } catch (e: any) {
      notifyError(e?.message ?? 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const rowMenu = (inv: InvoiceListItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[var(--tl-ink-3)] hover:text-[var(--tl-ink)]"
          disabled={busyId === inv.id}
          aria-label="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`${routes.app.invoices}/${inv.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        {canMutate ? (
          <>
            <DropdownMenuItem asChild>
              <Link href={`${routes.app.invoices}/${inv.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void rowAction(inv, 'duplicate')}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${routes.app.invoices}/${inv.id}#reminder`}>
                <Bell className="mr-2 h-4 w-4" />
                Send reminder
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={inv.status === 'paid' || inv.balance_amount <= 0}
              onClick={() => void rowAction(inv, 'paid')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as paid
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={`${routes.app.invoices}/${inv.id}/print`} target="_blank" rel="noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Link>
        </DropdownMenuItem>
        {canMutate ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onClick={() => void rowAction(inv, 'delete')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <MoneyWorkspace
      title="Invoices"
      description="Create, send, and get paid — your full invoice ledger."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canMutate ? (
            <Button type="button" variant="ghost" onClick={() => setImportOpen(true)}>
              Import
            </Button>
          ) : null}
          {canMutate ? (
            <Button asChild>
              <Link href={`${routes.app.invoices}/new`}>New invoice</Link>
            </Button>
          ) : (
            <InvoiceComposerLauncher label="New invoice" />
          )}
        </div>
      }
      subNav={<MoneySubNav items={MONEY_INVOICE_SUBNAV} />}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        {hasPageDraft && canMutate ? (
          <div className="ti-invoice-draft-banner">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--tl-ink)]">Unfinished invoice</p>
              <p className="ti-small mt-1">
                <span>{draftClientLabel}</span>
                {pageDraft?.savedAt ? <> · saved {new Date(pageDraft.savedAt).toLocaleString()}</> : null}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-sm text-[var(--tl-ink-3)] hover:text-[var(--tl-ink)]"
                onClick={() => {
                  void discardPersistedDraft(INVOICE_AUTOSAVE_SCOPE_PAGE, pageDraft?.serverInvoiceId).then(() =>
                    refreshPageDraft()
                  );
                }}
              >
                Discard
              </button>
              <Button asChild size="sm">
                <Link href={`${routes.app.invoices}/new`}>Resume</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <PageSummary>
          <MoneyKpiGrid>
            <MoneyKpiCard
              icon={Wallet}
              label="Outstanding"
              value={formatMoney(metrics.outstanding, metrics.currency)}
              trend={`${metrics.openCount} open invoice${metrics.openCount === 1 ? '' : 's'}`}
              active={statusView === 'all'}
              onClick={() => onStatusView('all')}
            />
            <MoneyKpiCard
              icon={AlertCircle}
              label="Overdue"
              value={formatMoney(metrics.overdue, metrics.currency)}
              trend={metrics.overdue > 0 ? 'Needs collection' : 'Nothing overdue'}
              trendDown={metrics.overdue > 0}
              active={statusView === 'overdue'}
              onClick={() => onStatusView('overdue')}
            />
            <MoneyKpiCard
              icon={Banknote}
              label="Paid"
              value={formatMoney(metrics.paid, metrics.currency)}
              trend="Collected in ledger"
              trendUp
              active={statusView === 'paid'}
              onClick={() => onStatusView('paid')}
            />
            <MoneyKpiCard
              icon={FilePenLine}
              label="Drafts"
              value={metrics.drafts}
              trend="Ready to finish & send"
              active={statusView === 'draft'}
              onClick={() => onStatusView('draft')}
            />
          </MoneyKpiGrid>
        </PageSummary>

        <Surface variant="elevated" className="ti-panel ti-invoice-ledger flex min-h-0 flex-1 flex-col">
          <div className="ti-panel-head">
            <SectionHeader
              kicker="Ledger"
              title={`${filtered.length} invoice${filtered.length === 1 ? '' : 's'}`}
              description={
                statusView === 'all'
                  ? 'Every invoice in this workspace.'
                  : `Showing ${STATUS_PILLS.find((p) => p.value === statusView)?.label.toLowerCase()} invoices.`
              }
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSortAmountDesc((v) => !v)}
                  aria-label={sortAmountDesc ? 'Sort amount ascending' : 'Sort amount descending'}
                >
                  <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                  {sortAmountDesc ? 'Highest first' : 'Lowest first'}
                </Button>
              }
            />
          </div>

          <div className="ti-invoice-toolbar mt-1">
            <Tabs
              items={STATUS_PILLS.map((p) => ({ value: p.value, label: p.label }))}
              value={statusView}
              onChange={(v) => onStatusView(v as 'all' | InvoiceStatus)}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative sm:min-w-[14rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--tl-ink-3)]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search number or client"
                  className="pl-9"
                  aria-label="Search invoices"
                />
              </div>
              <Select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="sm:max-w-[13rem]"
                aria-label="Filter by client"
              >
                <option value="">All clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {error ? (
            <div className="ti-error mt-4" role="alert">
              <div className="font-medium">Couldn’t load invoices</div>
              <p className="ti-error-body">{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 space-y-0" aria-busy="true" aria-label="Loading invoices">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                kicker={noInvoicesAtAll ? 'No invoices' : 'No matches'}
                title={noInvoicesAtAll ? 'Your first invoice starts here.' : 'No invoices match these filters.'}
                description={
                  noInvoicesAtAll
                    ? 'Create your first invoice and start getting paid.'
                    : 'Try a different status, client, or search term.'
                }
                action={canMutate ? <InvoiceComposerLauncher /> : null}
              />
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((inv) => {
                  const meta = dueMeta(inv.due_date, inv.status);
                  const tone = rowTone(inv.status);
                  return (
                    <div key={inv.id} className="ti-invoice-card" data-tone={tone}>
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex min-w-0 items-start gap-2.5">
                          {canMutate ? (
                            <input
                              type="checkbox"
                              checked={selected.has(inv.id)}
                              onChange={() => toggleRow(inv.id)}
                              className="mt-1 rounded border-border"
                            />
                          ) : null}
                          <div className="min-w-0">
                            <Link
                              href={`${routes.app.invoices}/${inv.id}`}
                              className="ti-invoice-number hover:underline"
                            >
                              {inv.invoice_number || inv.id.slice(0, 8)}
                            </Link>
                            <div className="ti-invoice-client mt-1 truncate">{inv.client_name ?? '—'}</div>
                            <div className="ti-invoice-meta">Issued {formatDue(inv.issue_date)}</div>
                          </div>
                        </label>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <div className="ti-meta">Amount</div>
                          <div className="ti-invoice-amount mt-1">{formatMoney(inv.total_amount, inv.currency)}</div>
                          {inv.status !== 'paid' && inv.balance_amount > 0 && inv.balance_amount !== inv.total_amount ? (
                            <div className="ti-invoice-amount-sub text-left">
                              {formatMoney(inv.balance_amount, inv.currency)} due
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <div className="ti-meta">Due</div>
                          <div className={cn('ti-invoice-due mt-1', meta?.overdue && 'is-overdue')}>
                            {formatDue(inv.due_date)}
                          </div>
                          {meta ? (
                            <div className={cn('ti-invoice-due-meta', meta.overdue && 'is-overdue')}>{meta.label}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-[var(--tl-line)] pt-3">
                        <div className="flex gap-4 text-[13px] font-medium text-[var(--tl-ink-2)]">
                          <Link href={`${routes.app.invoices}/${inv.id}`} className="hover:text-[var(--tl-ink)]">
                            View
                          </Link>
                          {canMutate ? (
                            <Link
                              href={`${routes.app.invoices}/${inv.id}/edit`}
                              className="hover:text-[var(--tl-ink)]"
                            >
                              Edit
                            </Link>
                          ) : null}
                        </div>
                        {rowMenu(inv)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 hidden min-h-0 flex-1 overflow-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        {canMutate ? (
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            aria-label="Select all"
                            className="rounded border-border"
                          />
                        ) : null}
                      </TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase tracking-[0.08em]"
                          onClick={() => setSortAmountDesc((v) => !v)}
                        >
                          Amount
                          <span aria-hidden>{sortAmountDesc ? '↓' : '↑'}</span>
                        </button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="w-28 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => {
                      const meta = dueMeta(inv.due_date, inv.status);
                      const tone = rowTone(inv.status);
                      return (
                        <TableRow
                          key={inv.id}
                          className="group"
                          data-state={selected.has(inv.id) ? 'selected' : undefined}
                          data-tone={tone}
                        >
                          <TableCell>
                            {canMutate ? (
                              <input
                                type="checkbox"
                                checked={selected.has(inv.id)}
                                onChange={() => toggleRow(inv.id)}
                                className="rounded border-border"
                                aria-label={`Select ${inv.invoice_number}`}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`${routes.app.invoices}/${inv.id}`}
                              className="ti-invoice-number hover:underline"
                            >
                              {inv.invoice_number || inv.id.slice(0, 8)}
                            </Link>
                            <div className="ti-invoice-meta">Issued {formatDue(inv.issue_date)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="ti-invoice-client">{inv.client_name ?? '—'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="ti-invoice-amount">{formatMoney(inv.total_amount, inv.currency)}</div>
                            {inv.status !== 'paid' &&
                            inv.balance_amount > 0 &&
                            inv.balance_amount !== inv.total_amount ? (
                              <div className="ti-invoice-amount-sub">
                                {formatMoney(inv.balance_amount, inv.currency)} due
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <span className="ti-status-enter inline-flex">
                              <StatusBadge status={inv.status} />
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className={cn('ti-invoice-due', meta?.overdue && 'is-overdue')}>
                              {formatDue(inv.due_date)}
                            </div>
                            {meta ? (
                              <div className={cn('ti-invoice-due-meta', meta.overdue && 'is-overdue')}>{meta.label}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <div className="hidden items-center gap-1 opacity-0 transition-opacity duration-[var(--ti-duration-hover)] group-hover:opacity-100 group-focus-within:opacity-100 xl:flex">
                                <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-[12.5px]">
                                  <Link href={`${routes.app.invoices}/${inv.id}`}>View</Link>
                                </Button>
                                {canMutate ? (
                                  <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-[12.5px]">
                                    <Link href={`${routes.app.invoices}/${inv.id}/edit`}>Edit</Link>
                                  </Button>
                                ) : null}
                              </div>
                              {rowMenu(inv)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          <PageActions>
            {selected.size > 0 ? (
              <div className="flex w-full flex-wrap items-center gap-3 text-sm sm:w-auto">
                <span className="font-medium text-[var(--tl-ink-2)]">{selected.size} selected</span>
                {canMutate ? (
                  <Button type="button" size="sm" variant="secondary" disabled={bulkBusy} onClick={() => void runBulkRemind()}>
                    <Bell className="h-3.5 w-3.5" />
                    Send reminders
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => exportCsv(filtered.filter((i) => selected.has(i.id)))}
                >
                  Export CSV
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            ) : (
              <Button type="button" size="sm" variant="secondary" onClick={() => exportCsv(filtered)} disabled={!filtered.length}>
                Export CSV
              </Button>
            )}
          </PageActions>
        </Surface>
      </div>

      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import invoices"
        description="Upload CSV, Excel, PDF, or an image. From PDF/image we OCR text and look for comma-, tab-, or semicolon-separated columns. Each row needs client_email (existing client), invoice_number, issue_date, due_date, line description, quantity, unit_price. Optional: currency, tax_rate, notes."
        endpoint="/api/invoices/import"
        templateHref="/import-templates/timely-invoices.csv"
        onSuccess={() => void loadInvoices()}
      />
    </MoneyWorkspace>
  );
}
