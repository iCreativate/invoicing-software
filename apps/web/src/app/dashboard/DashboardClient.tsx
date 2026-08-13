'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { StatCard } from '@/components/dashboard-ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import type { DashboardInvoice, DashboardSummary } from '@/lib/dashboard/types';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
import { AskTimelyDrawer } from '@/components/ai/AskTimelyDrawer';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { themeTokens } from '@/theme/tokens';

export type { DashboardInvoice };

function greetingForHour(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function nameFromEmail(email: string | null) {
  if (!email) return 'there';
  const local = email.split('@')[0]?.trim() || '';
  if (!local) return 'there';
  const token = local.split(/[._+-]/)[0] || local;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function formatDue(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export default function DashboardClient({
  userEmail,
  summary,
}: {
  userEmail: string | null;
  summary: DashboardSummary;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'due_date', desc: true }]);
  const [cashflowDays, setCashflowDays] = useState<7 | 30 | 90>(30);
  const {
    currency,
    overview,
    revenueByDay,
    insights,
    recentInvoices,
    actionItems,
    businessPulse,
    expectedIncoming,
  } = summary;
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const hour = new Date().getHours();
  const firstName = nameFromEmail(userEmail);
  const mom = insights.collectionMomPercent;
  const upMom = mom != null && mom >= 0;

  const columns = useMemo<ColumnDef<DashboardInvoice>[]>(
    () => [
      {
        accessorKey: 'invoice_number',
        header: 'Invoice',
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">{row.original.invoice_number || row.original.id.slice(0, 8)}</span>
        ),
      },
      {
        accessorKey: 'client_name',
        header: 'Client',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.client_name ?? '—'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'due_date',
        header: 'Due date',
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatDue(row.original.due_date)}</span>,
      },
      {
        id: 'amount',
        accessorFn: (row) => (row.balance_amount > 0 ? row.balance_amount : row.total_amount),
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {formatMoney(row.original.balance_amount > 0 ? row.original.balance_amount : row.original.total_amount, row.original.currency)}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: recentInvoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const isDemoRow = (id: string) => id.startsWith('00000000-0000-0000-0000-');

  const lineData = useMemo(() => {
    const slice = revenueByDay.slice(-cashflowDays);
    const n = Math.max(1, slice.length - 1);
    return slice.map((d, i) => {
      const t = i / n;
      const expected = expectedIncoming * (0.35 + 0.65 * t) * (0.55 + 0.45 * Math.sin(i / 3));
      const overdue = overview.overdueAmount * (0.7 + 0.3 * Math.cos(i / 4));
      return {
        ...d,
        collected: d.amount,
        expected: Math.round(expected),
        overdue: Math.round(overdue),
        tick: cashflowDays <= 7 ? d.label : i % Math.max(1, Math.floor(slice.length / 6)) === 0 ? d.label : '',
      };
    });
  }, [revenueByDay, cashflowDays, expectedIncoming, overview.overdueAmount]);

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartBox, setChartBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w > 8 && h > 8) setChartBox({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const healthBadge =
    businessPulse.health === 'at_risk'
      ? 'bg-danger/12 text-danger'
      : businessPulse.health === 'watch'
        ? 'bg-warning/12 text-warning'
        : 'bg-success/12 text-success';

  return (
    <AppShell
      hideHeader
      actions={
        <div className="flex items-center gap-1.5">
          <AskTimelyDrawer />
          <InvoiceComposerLauncher />
        </div>
      }
    >
      <div className="flex w-full flex-col gap-5">
        <header className="min-w-0">
          <h1 className="page-title">
            {greetingForHour(hour)}, {firstName}
          </h1>
          <p className="page-subtitle">Here&apos;s how your business is doing today.</p>
        </header>

        <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Paid this month"
            value={formatMoney(overview.paidThisMonth, currency)}
            sub={
              mom != null && Number.isFinite(mom) ? (
                <span className={upMom ? 'metric-trend-up' : 'metric-trend-down'}>
                  {upMom ? '↑' : '↓'} {Math.abs(mom).toFixed(1)}% vs last month
                </span>
              ) : (
                'Not enough history yet'
              )
            }
          />
          <StatCard
            label="Outstanding"
            value={formatMoney(overview.outstandingAmount, currency)}
            sub={`${overview.outstandingInvoiceCount} invoice${overview.outstandingInvoiceCount === 1 ? '' : 's'}`}
          />
          <StatCard
            label="Overdue"
            value={formatMoney(overview.overdueAmount, currency)}
            highlight="danger"
            sub={`${overview.overdueInvoiceCount} invoice${overview.overdueInvoiceCount === 1 ? '' : 's'}`}
          />
          <StatCard
            label="Expected (14d)"
            value={formatMoney(expectedIncoming, currency)}
            sub="Due in next two weeks"
          />
        </section>

        <section
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          aria-label="Cashflow, actions, invoices, and pulse"
        >
          <GlassCard className="flex min-h-0 flex-col overflow-hidden p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="section-title">Cashflow overview</h3>
                <p className="mt-0.5 text-[13px] text-slate-500">Collected, expected & overdue</p>
              </div>
              <div className="flex gap-0.5">
                {([7, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCashflowDays(d)}
                    className={cn(
                      'rounded-[var(--tl-radius)] px-2.5 py-1 text-[12px] font-medium transition-colors duration-150',
                      cashflowDays === d
                        ? 'bg-primary text-white'
                        : 'text-slate-500 hover:text-foreground'
                    )}
                  >
                    {d === 30 ? 'Last 30 days' : `${d}d`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex shrink-0 flex-wrap gap-4 text-[12.5px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: themeTokens.chart.collected }} /> Collected{' '}
                <span className="tabular font-medium text-slate-900">{formatMoney(overview.paidThisMonth, currency)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: themeTokens.chart.expected }} /> Expected{' '}
                <span className="tabular font-medium text-slate-900">{formatMoney(expectedIncoming, currency)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: themeTokens.chart.overdue }} /> Overdue{' '}
                <span className="tabular font-medium text-slate-900">{formatMoney(overview.overdueAmount, currency)}</span>
              </span>
            </div>

            <div ref={chartRef} className="relative h-56 w-full min-w-0 overflow-hidden">
              {lineData.some((d) => d.collected > 0 || d.expected > 0) ? (
                chartBox ? (
                <AreaChart width={chartBox.w} height={chartBox.h} data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cashflow-collected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeTokens.chart.collected} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={themeTokens.chart.collected} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cashflow-expected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeTokens.chart.expected} stopOpacity={0.16} />
                        <stop offset="100%" stopColor={themeTokens.chart.expected} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cashflow-overdue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={themeTokens.chart.overdue} stopOpacity={0.14} />
                        <stop offset="100%" stopColor={themeTokens.chart.overdue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={themeTokens.chart.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="tick"
                      tick={{ fontSize: 11, fill: themeTokens.chart.axis }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ stroke: 'rgba(15, 23, 42, 0.08)', strokeWidth: 1 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as (typeof lineData)[0];
                        return (
                          <div className="rounded-[var(--tl-radius)] border border-[var(--tl-line)] bg-white px-3.5 py-2.5 shadow-[var(--ti-shadow)]">
                            <div className="text-[12px] font-medium text-slate-900">{row?.label}</div>
                            <div className="mt-2 space-y-1.5">
                              {(
                                [
                                  ['Collected', row?.collected, themeTokens.chart.collected],
                                  ['Expected', row?.expected, themeTokens.chart.expected],
                                  ['Overdue', row?.overdue, themeTokens.chart.overdue],
                                ] as const
                              ).map(([label, amount, color]) => (
                                <div key={label} className="flex items-center justify-between gap-6 text-[12.5px]">
                                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                                    {label}
                                  </span>
                                  <span className="tabular font-medium text-slate-900">
                                    {formatMoney(Number(amount ?? 0), currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      stroke={themeTokens.chart.collected}
                      strokeWidth={2.75}
                      fill="url(#cashflow-collected)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: themeTokens.chart.collected }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expected"
                      stroke={themeTokens.chart.expected}
                      strokeWidth={2.25}
                      strokeDasharray="5 4"
                      fill="url(#cashflow-expected)"
                      dot={false}
                      activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: themeTokens.chart.expected }}
                    />
                    <Area
                      type="monotone"
                      dataKey="overdue"
                      stroke={themeTokens.chart.overdue}
                      strokeWidth={2.25}
                      fill="url(#cashflow-overdue)"
                      dot={false}
                      activeDot={{ r: 3.5, strokeWidth: 2, stroke: '#fff', fill: themeTokens.chart.overdue }}
                    />
                </AreaChart>
                ) : null
              ) : (
                <div className="flex h-full min-h-[14rem] items-center justify-center rounded-lg border border-dashed border-border text-sm text-slate-500">
                  No payment history in this window yet.
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="flex min-h-0 max-h-[28rem] flex-col overflow-hidden p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Needs attention</h3>
              <span className="text-[12px] text-slate-400">What to do next</span>
            </div>
            {actionItems.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing urgent — you&apos;re clear for now.</p>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 border-t border-[var(--tl-line)] py-3 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] text-slate-600">{item.title}</div>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-3">
                      <span className="tabular text-[13.5px] font-medium text-foreground">
                        {formatMoney(item.amount, currency)}
                      </span>
                      <Button
                        asChild
                        size="sm"
                        variant={item.kind === 'overdue' ? 'primary' : 'ghost'}
                        className="btn-sm"
                      >
                        <Link href={item.href}>{item.cta}</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="flex min-h-0 max-h-[28rem] flex-col overflow-hidden">
            <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="section-title">Recent invoices</h2>
                <p className="text-xs text-muted-foreground">Open a row to view details</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="self-start sm:self-auto">
                <Link href={routes.app.invoices}>View all</Link>
              </Button>
            </div>
            <div className="flex-1 overflow-x-auto">
              {recentInvoices.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  <p>No invoices yet.</p>
                  {canMutate ? (
                    <Button asChild className="mt-4" variant="primary">
                      <Link href={`${routes.app.invoices}/new`}>Create your first invoice</Link>
                    </Button>
                  ) : (
                    <p className="mt-3 text-xs">Read-only users cannot create invoices.</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(header.column.getCanSort() && 'cursor-pointer select-none')}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="inline-flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? null}
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => {
                      const href = isDemoRow(row.original.id) ? '#' : `${routes.app.invoices}/${row.original.id}`;
                      return (
                        <TableRow
                          key={row.id}
                          className="ti-row-hover cursor-pointer"
                          role="link"
                          tabIndex={0}
                          onClick={() => {
                            if (href !== '#') router.push(href);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (href !== '#') router.push(href);
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </GlassCard>

          <GlassCard className="flex min-h-0 flex-col overflow-hidden p-5">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="section-title">Business pulse</h2>
              <span className={cn('rounded-[var(--ti-radius-sm)] px-2 py-0.5 text-[11px] font-semibold capitalize', healthBadge)}>
                {businessPulse.health.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{businessPulse.headline}</p>
            <dl className="mt-auto space-y-4 pt-6">
              <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Average payment time</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {businessPulse.avgDaysToPay != null ? `${businessPulse.avgDaysToPay.toFixed(1)} days` : '—'}
                  </dd>
                </div>
                {businessPulse.avgDaysDelta != null ? (
                  <dd
                    className={cn(
                      'text-xs font-medium tabular-nums',
                      businessPulse.avgDaysDelta <= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    {businessPulse.avgDaysDelta > 0 ? '+' : ''}
                    {businessPulse.avgDaysDelta.toFixed(1)} days
                  </dd>
                ) : null}
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Collection rate</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {businessPulse.collectionRatePercent != null ? `${businessPulse.collectionRatePercent.toFixed(1)}%` : '—'}
                  </dd>
                </div>
                {businessPulse.collectionRateDelta != null ? (
                  <dd
                    className={cn(
                      'text-xs font-medium tabular-nums',
                      businessPulse.collectionRateDelta >= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    {businessPulse.collectionRateDelta >= 0 ? '+' : ''}
                    {businessPulse.collectionRateDelta.toFixed(1)}%
                  </dd>
                ) : businessPulse.collectionMomPercent != null ? (
                  <dd
                    className={cn(
                      'text-xs font-medium tabular-nums',
                      businessPulse.collectionMomPercent >= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    MoM {businessPulse.collectionMomPercent >= 0 ? '+' : ''}
                    {businessPulse.collectionMomPercent.toFixed(1)}%
                  </dd>
                ) : null}
              </div>
            </dl>
          </GlassCard>
        </section>
      </div>

      <div className="fixed bottom-5 right-5 z-50 sm:hidden ti-no-print">
        <InvoiceComposerLauncher label="" icon className="h-14 w-14 rounded-full shadow-[var(--ti-shadow-lift)]" />
      </div>
    </AppShell>
  );
}
