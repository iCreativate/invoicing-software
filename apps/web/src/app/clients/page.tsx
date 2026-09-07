'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, Search, UserCheck, Users, Wallet } from 'lucide-react';
import { ClientsWorkspace } from '@/components/clients/ClientsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { PageSummary } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { routes } from '@/lib/routing/routes';
import { fetchClientDirectory } from '@/features/clients/api';
import type { ClientDirectoryRow, ClientDirectoryStatus } from '@/lib/clients/directory';
import { directoryStatusLabel } from '@/lib/clients/directory';
import { formatMoney } from '@/lib/format/money';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { cn } from '@/lib/utils/cn';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? 'C';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (a + b).toUpperCase();
}

function statusVariant(status: ClientDirectoryStatus): 'danger' | 'warning' | 'success' | 'default' {
  if (status === 'overdue') return 'danger';
  if (status === 'outstanding') return 'warning';
  if (status === 'active') return 'success';
  return 'default';
}

function rowTone(status: ClientDirectoryStatus): 'paid' | 'overdue' | 'draft' | 'open' {
  if (status === 'overdue') return 'overdue';
  if (status === 'outstanding') return 'open';
  if (status === 'active') return 'paid';
  return 'draft';
}

type ClientFilter = 'all' | 'overdue' | 'outstanding';

const CLIENT_FILTERS: { value: ClientFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'outstanding', label: 'Outstanding' },
];

export default function ClientsPage() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClientDirectoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientFilter>('all');

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('status');
    if (s === 'overdue' || s === 'outstanding') setStatusFilter(s);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchClientDirectory();
        if (!alive) return;
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load clients. Ensure Supabase tables exist.');
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
    let rows = items;
    if (statusFilter === 'overdue') rows = rows.filter((c) => c.status === 'overdue');
    if (statusFilter === 'outstanding') rows = rows.filter((c) => c.status === 'overdue' || c.status === 'outstanding');
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => `${c.name} ${c.email ?? ''} ${c.companyName ?? ''}`.toLowerCase().includes(q));
  }, [items, query, statusFilter]);

  const onStatusFilter = (value: ClientFilter) => {
    setStatusFilter(value);
    router.replace(value === 'all' ? pathname : `${pathname}?status=${value}`, { scroll: false });
  };

  const totals = useMemo(() => {
    const outstanding = items.reduce((s, c) => s + c.outstanding, 0);
    return {
      total: items.length,
      active: items.filter((c) => c.status !== 'new').length,
      outstanding,
      overdue: items.filter((c) => c.status === 'overdue').length,
      currency: items.find((c) => c.outstanding > 0)?.currency ?? 'ZAR',
    };
  }, [items]);

  return (
    <ClientsWorkspace
      actions={
        canMutate ? (
          <Button asChild size="sm">
            <Link href={`${routes.app.clients}/new`}>New client</Link>
          </Button>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        <PageSummary>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Relationship snapshot">
            <button
              type="button"
              onClick={() => onStatusFilter('outstanding')}
              className={cn(
                'ti-kpi-card w-full outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]',
                statusFilter === 'outstanding' && 'ring-2 ring-[color-mix(in_srgb,var(--tl-accent)_40%,transparent)]'
              )}
            >
              <span className="ti-kpi-icon" aria-hidden>
                <Wallet className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{loading ? '—' : formatMoney(totals.outstanding, totals.currency)}</span>
              <span className="ti-kpi-label">Outstanding</span>
              <span className={cn('ti-kpi-trend', totals.outstanding > 0 && 'ti-kpi-trend-down')}>
                {totals.total} clients
              </span>
            </button>
            <button
              type="button"
              onClick={() => onStatusFilter('all')}
              className={cn(
                'ti-kpi-card w-full outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]',
                statusFilter === 'all' && 'ring-2 ring-[color-mix(in_srgb,var(--tl-accent)_40%,transparent)]'
              )}
            >
              <span className="ti-kpi-icon" aria-hidden>
                <Users className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{loading ? '—' : String(totals.total)}</span>
              <span className="ti-kpi-label">Clients</span>
              <span className="ti-kpi-trend">In directory</span>
            </button>
            <button type="button" onClick={() => onStatusFilter('all')} className="ti-kpi-card w-full">
              <span className="ti-kpi-icon" aria-hidden>
                <UserCheck className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{loading ? '—' : String(totals.active)}</span>
              <span className="ti-kpi-label">Active</span>
              <span className="ti-kpi-trend">With history</span>
            </button>
            <button
              type="button"
              onClick={() => onStatusFilter('overdue')}
              className={cn(
                'ti-kpi-card w-full outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]',
                statusFilter === 'overdue' && 'ring-2 ring-[color-mix(in_srgb,var(--tl-accent)_40%,transparent)]'
              )}
            >
              <span className="ti-kpi-icon" aria-hidden>
                <AlertCircle className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{loading ? '—' : String(totals.overdue)}</span>
              <span className="ti-kpi-label">Overdue</span>
              <span className={cn('ti-kpi-trend', totals.overdue > 0 && 'ti-kpi-trend-down')}>
                {totals.overdue > 0 ? 'Needs follow-up' : 'All clear'}
              </span>
            </button>
          </div>
        </PageSummary>

        <AdminPanel
          kicker="Directory"
          title={`${filtered.length} client${filtered.length === 1 ? '' : 's'}`}
          description={
            statusFilter === 'overdue'
              ? 'Clients with overdue balances.'
              : statusFilter === 'outstanding'
                ? 'Clients with open balances.'
                : 'Every relationship in this workspace.'
          }
          className="ti-invoice-ledger flex min-h-0 flex-1 flex-col overflow-hidden"
          bodyClassName="mt-0 min-h-0 flex-1"
        >
          <div className="ti-invoice-toolbar">
            <Tabs
              items={CLIENT_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
              value={statusFilter}
              onChange={(v) => onStatusFilter(v as ClientFilter)}
            />
            <div className="ti-invoice-toolbar-filters">
              <div className="relative w-full sm:w-[15rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--tl-ink-3)]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search clients"
                  className="pl-9"
                  aria-label="Search clients"
                />
              </div>
            </div>
          </div>

          {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

          {loading ? (
            <div className="mt-5 space-y-0" aria-busy="true" aria-label="Loading clients">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                  <Skeleton className="h-9 w-9 rounded-2xl" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                kicker={items.length === 0 ? 'No clients' : 'No matches'}
                title={
                  items.length === 0
                    ? 'Your first relationship starts here.'
                    : statusFilter === 'overdue'
                      ? 'No overdue clients right now.'
                      : statusFilter === 'outstanding'
                        ? 'No clients with open balances.'
                        : 'No clients match that search.'
                }
                description={
                  items.length === 0
                    ? 'Add a client, then send an invoice and start getting paid.'
                    : 'Try a different filter or search term.'
                }
                action={
                  canMutate && items.length === 0 ? (
                    <Button asChild>
                      <Link href={`${routes.app.clients}/new`}>New client</Link>
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : null}

          {!loading && !error && filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((c) => (
                  <Link
                    key={c.id}
                    href={`${routes.app.clients}/${c.id}`}
                    className="ti-invoice-card block"
                    data-tone={rowTone(c.status)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="ti-invoice-client truncate">{c.name}</div>
                          <div className="ti-invoice-meta mt-1 truncate">{c.email ?? '—'}</div>
                        </div>
                      </div>
                      <Badge variant={statusVariant(c.status)}>{directoryStatusLabel(c.status)}</Badge>
                    </div>
                    <div className="ti-invoice-amount">{formatMoney(c.outstanding, c.currency)}</div>
                    <div className="ti-invoice-meta border-t border-[var(--tl-line)] pt-3">
                      {c.invoiceCount} invoice{c.invoiceCount === 1 ? '' : 's'}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4 hidden min-h-0 flex-1 overflow-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Last payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-28 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id} className="group" data-tone={rowTone(c.status)}>
                        <TableCell>
                          <Link href={`${routes.app.clients}/${c.id}`} className="flex items-center gap-3 hover:opacity-80">
                            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                              {initials(c.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="ti-invoice-number truncate">{c.name}</div>
                              {c.companyName && c.companyName !== c.name ? (
                                <div className="ti-invoice-meta mt-0.5 truncate">{c.companyName}</div>
                              ) : null}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.email ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.invoiceCount}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(c.outstanding, c.currency)}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{c.lastPayment ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(c.status)}>{directoryStatusLabel(c.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="ti-ledger-actions inline-flex justify-end">
                            <Link
                              href={`${routes.app.clients}/${c.id}`}
                              className="text-[13px] font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
                            >
                              View
                            </Link>
                            {canMutate ? (
                              <Link
                                href={`${routes.app.clients}/${c.id}/edit`}
                                className="text-[13px] font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
                              >
                                Edit
                              </Link>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </AdminPanel>
      </div>
    </ClientsWorkspace>
  );
}
