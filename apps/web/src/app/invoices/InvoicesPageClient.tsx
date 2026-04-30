'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageActions, PageBody } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import type { InvoiceListItem, InvoiceStatus } from '@/features/invoices/types';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
import { InvoiceListStatusBadge } from '@/components/invoice/InvoiceListStatusBadge';
import { fetchClientsList } from '@/features/clients/api';
import type { ClientListItem } from '@/features/clients/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
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
  Filter,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { clearDraft, loadDraft, INVOICE_AUTOSAVE_SCOPE_PAGE } from '@/components/invoice/composer/autosave';
import { FileImportDialog } from '@/components/import/FileImportDialog';

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function InvoicesPageClient() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [items, setItems] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<Set<InvoiceStatus>>(new Set());
  const [clientId, setClientId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [pageDraft, setPageDraft] = useState<ReturnType<typeof loadDraft>>(null);

  const refreshPageDraft = useCallback(() => {
    try {
      setPageDraft(loadDraft(INVOICE_AUTOSAVE_SCOPE_PAGE));
    } catch {
      setPageDraft(null);
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
    if (statusFilter.size) params.set('status', [...statusFilter].join(','));
    if (clientId) params.set('clientId', clientId);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const res = await fetch(`/api/invoices?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to load invoices');
    setItems(json.data.invoices as InvoiceListItem[]);
  }, [statusFilter, clientId, dateFrom, dateTo]);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((inv) => {
      const hay = `${inv.invoice_number} ${inv.client_name ?? ''} ${inv.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const toggleStatus = (s: InvoiceStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

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

  const hasPageDraft = Boolean(pageDraft?.draft);

  return (
    <AppShell
      title="Invoices"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {hasPageDraft && canMutate ? (
            <Link href={`${routes.app.invoices}/new`} className="text-sm font-semibold text-primary hover:underline">
              Resume draft
            </Link>
          ) : null}
          {canMutate ? (
            <Button type="button" variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          ) : null}
          <InvoiceComposerLauncher />
        </div>
      }
    >
      <PageBody maxWidthClassName="max-w-6xl">
      <Card className="overflow-hidden p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {hasPageDraft && canMutate ? (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Resume unfinished invoice?</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{draftClientLabel}</span>
                    {pageDraft?.savedAt ? (
                      <>
                        {' '}
                        · saved {new Date(pageDraft.savedAt).toLocaleString()}
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      clearDraft(INVOICE_AUTOSAVE_SCOPE_PAGE);
                      refreshPageDraft();
                    }}
                  >
                    Discard
                  </Button>
                  <Link href={`${routes.app.invoices}/new`}>
                    <Button type="button">Resume</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold">Invoice management</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${filtered.length} invoice(s) shown`}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:max-w-md lg:max-w-sm">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search number, client, status…" />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground sm:mr-2">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleStatus(o.value)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    statusFilter.has(o.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 min-w-0 w-full sm:w-[150px]"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 min-w-0 w-full sm:w-[150px]"
              />
            </div>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-9 w-full min-w-0 rounded-lg border border-border bg-background px-2 text-sm sm:min-w-[180px] sm:w-auto"
            >
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No invoices match your filters.
              <div className="mt-3 flex justify-center">
                {canMutate ? <InvoiceComposerLauncher /> : null}
              </div>
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {filtered.map((inv) => (
                  <Card key={inv.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-start gap-2">
                        {canMutate ? (
                          <input
                            type="checkbox"
                            checked={selected.has(inv.id)}
                            onChange={() => toggleRow(inv.id)}
                            className="mt-1 rounded border-border"
                          />
                        ) : null}
                        <div>
                          <Link href={`${routes.app.invoices}/${inv.id}`} className="font-semibold hover:underline">
                            {inv.invoice_number || inv.id.slice(0, 8)}
                          </Link>
                          <div className="text-sm text-muted-foreground">{inv.client_name ?? '—'}</div>
                        </div>
                      </label>
                      <InvoiceListStatusBadge inv={inv} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Amount</div>
                        <div className="font-semibold tabular-nums">{formatMoney(inv.total_amount, inv.currency)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Due</div>
                        <div className="font-medium">{inv.due_date || '—'}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`${routes.app.invoices}/${inv.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                      {canMutate ? (
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`${routes.app.invoices}/${inv.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
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
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => (
                      <TableRow key={inv.id} className="group">
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
                          <Link href={`${routes.app.invoices}/${inv.id}`} className="font-semibold hover:underline">
                            {inv.invoice_number || inv.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{inv.client_name ?? '—'}</TableCell>
                        <TableCell className="tabular-nums font-medium">{formatMoney(inv.total_amount, inv.currency)}</TableCell>
                        <TableCell>
                          <InvoiceListStatusBadge inv={inv} />
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{inv.due_date || '—'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={busyId === inv.id}
                                aria-label="Invoice actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem asChild>
                                <Link href={`${routes.app.invoices}/${inv.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          <PageActions>
            {selected.size > 0 ? (
              <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm sm:w-auto">
                <span className="font-medium">{selected.size} selected</span>
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
                  Export CSV (selected)
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            ) : (
              <Button type="button" size="sm" variant="secondary" onClick={() => exportCsv(filtered)}>
                Export CSV (filtered)
              </Button>
            )}
          </PageActions>
        </div>
      </Card>

      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import invoices"
        description="Upload CSV, Excel, PDF, or an image. From PDF/image we OCR text and look for comma-, tab-, or semicolon-separated columns. Each row needs client_email (existing client), invoice_number, issue_date, due_date, line description, quantity, unit_price. Optional: currency, tax_rate, notes."
        endpoint="/api/invoices/import"
        templateHref="/import-templates/timely-invoices.csv"
        onSuccess={() => void loadInvoices()}
      />
      </PageBody>
    </AppShell>
  );
}
