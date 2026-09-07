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
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertCircle,
  Banknote,
  Clock3,
  FileText,
  Plus,
  Receipt,
  Send,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { Amount } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { AppPageHero } from '@/components/layout/AppPageHero';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { openAskTimely } from '@/components/ai/AskTimelyDrawer';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import type { DashboardActivity, DashboardInvoice, DashboardSummary } from '@/lib/dashboard/types';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
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

function formatRelativeTime(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso.slice(0, 10);
  const diffMs = Date.now() - t;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function isDemoRow(id: string) {
  return id.startsWith('00000000-0000-0000-0000-');
}

function invoiceHref(id: string) {
  return isDemoRow(id) ? '#' : `${routes.app.invoices}/${id}`;
}

function rowAction(inv: DashboardInvoice): { label: string; href: string } {
  const view = invoiceHref(inv.id);
  if (inv.status === 'overdue') return { label: 'Collect', href: isDemoRow(inv.id) ? '#' : routes.app.collections };
  if (inv.status === 'draft') return { label: 'Continue', href: view };
  return { label: 'View', href: view };
}

function activityCopy(ev: DashboardActivity): { title: string; detail: string; status: DashboardInvoice['status'] | null } {
  if (ev.type === 'invoice_sent') {
    return {
      title: 'Invoice sent',
      detail: [ev.invoiceNumber, ev.clientName].filter(Boolean).join(' · ') || 'Invoice sent to client',
      status: 'sent',
    };
  }
  if (ev.type === 'payment_received') {
    return {
      title: 'Payment received',
      detail: `${formatMoney(ev.amount, ev.currency)}${ev.clientName ? ` · ${ev.clientName}` : ''}`,
      status: 'paid',
    };
  }
  return {
    title: 'Reminder sent',
    detail: [ev.channel, ev.invoiceNumber, ev.clientName].filter(Boolean).join(' · ') || 'Follow-up sent',
    status: 'viewed',
  };
}

function ActivityIcon({ type }: { type: DashboardActivity['type'] }) {
  if (type === 'payment_received') return <Banknote className="h-3.5 w-3.5" />;
  if (type === 'reminder_sent') return <Send className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
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
  const [chartRange, setChartRange] = useState<'6' | '12'>('6');
  const {
    currency,
    overview,
    monthlyIncomeVsExpense,
    insights,
    recentInvoices,
    expectedIncoming,
    activity,
  } = summary;
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const hour = new Date().getHours();
  const firstName = nameFromEmail(userEmail);
  const mom = insights.collectionMomPercent;
  const upMom = mom != null && mom >= 0;
  const noHistory =
    recentInvoices.length === 0 &&
    overview.outstandingAmount === 0 &&
    overview.paidThisMonth === 0 &&
    overview.overdueAmount === 0;

  const columns = useMemo<ColumnDef<DashboardInvoice>[]>(
    () => [
      {
        accessorKey: 'invoice_number',
        header: 'Invoice #',
        cell: ({ row }) => (
          <span className="font-semibold tracking-tight text-[var(--tl-ink)]">
            {row.original.invoice_number || row.original.id.slice(0, 8)}
          </span>
        ),
      },
      {
        accessorKey: 'client_name',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="text-[var(--tl-ink-2)]">{row.original.client_name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'due_date',
        header: 'Due date',
        cell: ({ row }) => (
          <span className="tabular-nums text-[var(--tl-ink-3)]">{formatDue(row.original.due_date)}</span>
        ),
      },
      {
        id: 'amount',
        accessorFn: (row) => (row.balance_amount > 0 ? row.balance_amount : row.total_amount),
        header: 'Amount',
        cell: ({ row }) => (
          <span className="ti-amount inline-block w-full">
            {formatMoney(
              row.original.balance_amount > 0 ? row.original.balance_amount : row.original.total_amount,
              row.original.currency
            )}
          </span>
        ),
      },
      {
        id: 'action',
        enableSorting: false,
        header: () => <span className="sr-only">Action</span>,
        cell: ({ row }) => {
          const action = rowAction(row.original);
          if (action.href === '#') return null;
          return (
            <Link
              href={action.href}
              className="text-[13px] font-medium text-[var(--tl-ink-2)] underline-offset-4 hover:text-[var(--tl-ink)] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {action.label}
            </Link>
          );
        },
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

  const barData = useMemo(() => {
    const slice = chartRange === '6' ? monthlyIncomeVsExpense.slice(-6) : monthlyIncomeVsExpense;
    return slice.map((d) => ({
      ...d,
      tick: d.label.length > 3 ? d.label.slice(0, 3) : d.label,
    }));
  }, [monthlyIncomeVsExpense, chartRange]);

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

  const hasChart = barData.some((d) => d.income > 0 || d.expense > 0);
  const kpis = [
    {
      href: routes.app.invoices,
      icon: Wallet,
      value: formatMoney(overview.outstandingAmount, currency),
      label: 'Outstanding',
      trend: `${overview.outstandingInvoiceCount} open invoice${overview.outstandingInvoiceCount === 1 ? '' : 's'}`,
    },
    {
      href: routes.app.collections,
      icon: AlertCircle,
      value: formatMoney(overview.overdueAmount, currency),
      label: 'Overdue',
      trend: `${overview.overdueInvoiceCount} need${overview.overdueInvoiceCount === 1 ? 's' : ''} collection`,
    },
    {
      href: routes.app.payments,
      icon: Banknote,
      value: formatMoney(overview.paidThisMonth, currency),
      label: 'Paid this month',
      trend:
        mom != null && Number.isFinite(mom)
          ? `${upMom ? '+' : '−'}${Math.abs(mom).toFixed(1)}% vs last month`
          : 'This month',
      trendUp: mom != null ? upMom : undefined,
    },
    {
      href: routes.app.cashflow,
      icon: Clock3,
      value: formatMoney(expectedIncoming, currency),
      label: 'Expected',
      trend: 'Next 14 days',
    },
    {
      href: routes.app.insights,
      icon: TrendingUp,
      value: formatMoney(overview.invoicedThisMonth, currency),
      label: 'Invoiced',
      trend: 'This month',
    },
  ] as const;

  const quickActions = [
    { href: `${routes.app.invoices}/new`, label: 'Create Invoice', show: canMutate },
    { href: `${routes.app.quotes}/new`, label: 'Create Quote', show: canMutate },
    { href: `${routes.app.clients}/new`, label: 'Create Client', show: canMutate },
    { href: routes.app.collections, label: 'Open Collections', show: true },
  ].filter((a) => a.show);

  return (
    <AppShell hideHeader>
      <div className="ti-page-enter flex w-full flex-col gap-4 md:gap-5">
        <AppPageHero
          kicker="Dashboard"
          title={`${greetingForHour(hour)}, ${firstName}.`}
          description="Here's how your business is doing today."
          image="money"
          imageAlt="Timely workspace"
          actions={
            canMutate ? (
              <Button asChild className="h-10">
                <Link href={`${routes.app.invoices}/new`}>
                  <Plus className="h-3.5 w-3.5" />
                  New invoice
                </Link>
              </Button>
            ) : null
          }
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Key metrics">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.label} href={kpi.href} className="ti-kpi-card outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]">
                <span className="ti-kpi-icon" aria-hidden>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="ti-kpi-value">{kpi.value}</span>
                <span className="ti-kpi-label">{kpi.label}</span>
                <span
                  className={cn(
                    'ti-kpi-trend',
                    'trendUp' in kpi && kpi.trendUp === true && 'ti-kpi-trend-up',
                    'trendUp' in kpi && kpi.trendUp === false && 'ti-kpi-trend-down'
                  )}
                >
                  {kpi.trend}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Chart + activity */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Surface variant="elevated" className="flex flex-col p-5 sm:p-6" aria-label="Cash collected vs expenses">
            <SectionHeader
              kicker="Cashflow"
              description="Collected vs expenses by month"
              actions={
                <div className="ti-pill-track">
                  {(['6', '12'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setChartRange(d)}
                      className={cn('ti-pill', chartRange === d ? 'ti-pill-active' : 'ti-pill-idle')}
                    >
                      Last {d} months
                    </button>
                  ))}
                </div>
              }
            />

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              <LegendSwatch color={themeTokens.chart.collected} label="Collected" />
              <LegendSwatch color={themeTokens.chart.expected} label="Expenses" />
            </div>

            <div ref={chartRef} className="relative mt-5 h-64 w-full min-w-0 overflow-hidden sm:h-72">
              {hasChart ? (
                chartBox ? (
                  <BarChart
                    width={chartBox.w}
                    height={chartBox.h}
                    data={barData}
                    margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                    barGap={4}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 6" stroke={themeTokens.chart.grid} />
                    <XAxis
                      dataKey="tick"
                      tick={{ fontSize: 11, fill: themeTokens.chart.axis }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(11, 15, 20, 0.03)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as (typeof barData)[0];
                        return (
                          <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-surface)] px-3.5 py-2.5 shadow-[var(--tl-shadow-float)]">
                            <p className="ti-caption">{row?.label}</p>
                            <div className="mt-2 space-y-1.5">
                              {(
                                [
                                  ['Collected', row?.income, themeTokens.chart.collected],
                                  ['Expenses', row?.expense, themeTokens.chart.expected],
                                ] as const
                              ).map(([label, amount, color]) => (
                                <div key={label} className="flex items-center justify-between gap-8 text-[12.5px]">
                                  <span className="inline-flex items-center gap-1.5 text-[var(--tl-ink-2)]">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                                    {label}
                                  </span>
                                  <span className="ti-amount text-[12.5px] font-medium">
                                    {formatMoney(Number(amount ?? 0), currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="income" fill={themeTokens.chart.collected} radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expense" fill={themeTokens.chart.expected} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : null
              ) : (
                <div className="flex h-full min-h-[14rem] flex-col justify-center px-1">
                  <p className="ti-body text-[var(--tl-ink-2)]">No cashflow history yet.</p>
                  {canMutate ? (
                    <div className="mt-4">
                      <Button asChild variant="secondary">
                        <Link href={`${routes.app.invoices}/new`}>Create an invoice</Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </Surface>

          <Surface variant="elevated" className="flex flex-col p-5 sm:p-6" aria-label="Recent activity">
            <SectionHeader
              kicker="Recent activity"
              actions={
                <Link
                  href={routes.app.notifications}
                  className="text-[13px] font-medium text-[var(--tl-ink-2)] underline-offset-4 hover:text-[var(--tl-ink)] hover:underline"
                >
                  View all
                </Link>
              }
            />

            {activity.length === 0 ? (
              <div className="mt-6">
                <p className="ti-body text-[var(--tl-ink-2)]">
                  {noHistory ? 'Activity will appear once you send invoices and collect payments.' : 'No recent events.'}
                </p>
              </div>
            ) : (
              <ul className="mt-2" role="list">
                {activity.slice(0, 6).map((ev, i) => {
                  const copy = activityCopy(ev);
                  const href =
                    'invoiceId' in ev && ev.invoiceId && !isDemoRow(ev.invoiceId)
                      ? `${routes.app.invoices}/${ev.invoiceId}`
                      : null;
                  const inner = (
                    <>
                      <span className="ti-activity-icon" aria-hidden>
                        <ActivityIcon type={ev.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-[13px] font-semibold tracking-tight text-[var(--tl-ink)]">{copy.title}</span>
                          <span className="shrink-0 text-[11px] tabular-nums text-[var(--tl-ink-3)]">
                            {formatRelativeTime(ev.at)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-[var(--tl-ink-2)]">{copy.detail}</span>
                      </span>
                      {copy.status ? (
                        <span className="hidden shrink-0 pt-0.5 sm:inline-flex">
                          <StatusBadge status={copy.status} />
                        </span>
                      ) : null}
                    </>
                  );
                  return (
                    <li key={`${ev.type}-${ev.at}-${i}`} className="ti-activity-row">
                      {href ? (
                        <Link href={href} className="flex min-w-0 flex-1 items-start gap-3">
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-start gap-3">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Surface>
        </div>

        {/* Invoices + quick actions */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Surface variant="elevated" className="flex flex-col p-5 sm:p-6" aria-label="Recent invoices">
            <SectionHeader
              kicker="Recent invoices"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href={routes.app.invoices}>View all</Link>
                </Button>
              }
            />
            {recentInvoices.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No invoices yet."
                  description="Create an invoice and start getting paid."
                  action={
                    canMutate ? (
                      <Button asChild variant="secondary">
                        <Link href={`${routes.app.invoices}/new`}>New invoice</Link>
                      </Button>
                    ) : (
                      <p className="ti-caption">Read-only users cannot create invoices.</p>
                    )
                  }
                />
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <Table className="[&_td]:py-3.5 [&_th]:py-3">
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={cn(
                              header.column.getCanSort() && 'cursor-pointer select-none',
                              (header.id === 'amount' || header.id === 'action') && 'text-right'
                            )}
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
                      const href = invoiceHref(row.original.id);
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
                            <TableCell
                              key={cell.id}
                              className={cn(
                                cell.column.id === 'amount' && 'ti-amount text-right',
                                cell.column.id === 'action' && 'text-right'
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Surface>

          <Surface variant="elevated" className="flex flex-col p-5 sm:p-6" aria-label="Quick actions">
            <SectionHeader kicker="Quick actions" />
            <div className="mt-5 flex flex-col gap-2.5">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="ti-quick-action">
                  <Plus className="h-3.5 w-3.5" />
                  {action.label}
                </Link>
              ))}
              <button type="button" className="ti-quick-action" onClick={() => openAskTimely()}>
                <Receipt className="h-3.5 w-3.5" />
                Ask Timely
              </button>
            </div>
          </Surface>
        </div>
      </div>

      <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 sm:hidden ti-no-print">
        <InvoiceComposerLauncher label="" icon className="h-14 w-14 rounded-full shadow-[var(--tl-shadow-float)]" />
      </div>
    </AppShell>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--tl-ink-2)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}
