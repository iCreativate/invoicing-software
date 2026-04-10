'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import type { DashboardInvoice, DashboardSummary } from '@/lib/dashboard/types';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  FilePlus2,
  FileText,
  Mail,
  Sparkles,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
import { AskTimelyDrawer } from '@/components/ai/AskTimelyDrawer';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';

export type { DashboardInvoice };

const PIE_COLORS = ['hsl(142 76% 36%)', 'hsl(var(--primary))'];

function formatActivityTime(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function OverviewCard({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <Card className={cn('rounded-xl border-border p-4 shadow-[var(--shadow-sm)] sm:p-5', className)}>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </Card>
  );
}

export default function DashboardClient({
  userEmail,
  summary,
}: {
  userEmail: string | null;
  summary: DashboardSummary;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'issue_date', desc: true }]);
  const { currency, overview, revenueByDay, paidVsUnpaid, insights, activity, recentInvoices } = summary;
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

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
        header: 'Due',
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.due_date ?? '—'}</span>,
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

  const lineData = useMemo(
    () =>
      revenueByDay.map((d, i) => ({
        ...d,
        tick: i % 10 === 0 ? d.label : '',
      })),
    [revenueByDay]
  );

  const pieTotal = paidVsUnpaid.reduce((s, x) => s + x.value, 0);
  const hasPieData = pieTotal > 0;

  const mom = insights.collectionMomPercent;
  const upMom = mom != null && mom >= 0;

  return (
    <AppShell
      hideHeader
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {userEmail ? (
            <Badge variant="outline" className="hidden font-normal sm:inline-flex">
              {userEmail}
            </Badge>
          ) : null}
          <AskTimelyDrawer />
          <InvoiceComposerLauncher className="shadow-[var(--shadow-md)]" />
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Live metrics from invoices and payments in your workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2 ti-no-print">
            <Button asChild variant="secondary" className="shadow-[var(--shadow-sm)]">
              <Link href={routes.app.reports}>
                <BarChart3 className="h-4 w-4" />
                Reports
              </Link>
            </Button>
            <InvoiceComposerLauncher label="New invoice" />
          </div>
        </div>

        <section aria-label="Financial overview">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewCard
              label="Total revenue (this month)"
              value={formatMoney(overview.invoicedThisMonth, currency)}
              sub="Invoiced in the current month"
            />
            <OverviewCard
              label="Outstanding invoices"
              value={formatMoney(overview.outstandingAmount, currency)}
              sub={`${overview.outstandingInvoiceCount} open invoice${overview.outstandingInvoiceCount === 1 ? '' : 's'}`}
            />
            <OverviewCard
              label="Overdue amount"
              value={formatMoney(overview.overdueAmount, currency)}
              sub={`${overview.overdueInvoiceCount} overdue`}
              className={overview.overdueAmount > 0 ? 'ring-1 ring-danger/20' : undefined}
            />
            <OverviewCard
              label="Paid this month"
              value={formatMoney(overview.paidThisMonth, currency)}
              sub="Cash collected (payments)"
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Charts">
          <Card className="rounded-xl border-border p-4 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Revenue over time</h2>
                <p className="text-xs text-muted-foreground">Daily cash collected (last 90 days)</p>
              </div>
            </div>
            <div className="mt-4 h-64 w-full min-w-0">
              {lineData.some((d) => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                    <XAxis dataKey="tick" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as (typeof lineData)[0];
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                            <div className="font-medium">{row?.label ?? label}</div>
                            <div className="text-muted-foreground">{formatMoney(Number(payload[0].value), currency)}</div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                  No payment history in this window yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-xl border-border p-4 shadow-[var(--shadow-sm)] sm:p-6">
            <div>
              <h2 className="text-sm font-semibold">Paid vs unpaid</h2>
              <p className="text-xs text-muted-foreground">Lifetime collected vs current outstanding</p>
            </div>
            <div className="mt-4 h-64 w-full min-w-0">
              {hasPieData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paidVsUnpaid}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {paidVsUnpaid.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatMoney(Number(value ?? 0), currency)}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                  No balances to compare yet.
                </div>
              )}
            </div>
            {hasPieData ? (
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                {paidVsUnpaid.map((s, i) => (
                  <span key={s.key} className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name}: {formatMoney(s.value, currency)}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Insights and activity">
          <Card className="rounded-xl border-border p-4 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Smart insights
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Derived from your latest invoice and payment data.</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3 rounded-xl border border-border bg-muted/20 p-3 dark:bg-muted/10">
                {mom != null && Number.isFinite(mom) ? (
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      upMom ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    )}
                  >
                    {upMom ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </span>
                ) : (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                )}
                <div>
                  <div className="font-medium text-foreground">Collection pace</div>
                  <p className="mt-0.5 text-muted-foreground">
                    {mom != null && Number.isFinite(mom) ? (
                      <>
                        You are <span className="font-semibold text-foreground">{upMom ? 'up' : 'down'} {Math.abs(mom).toFixed(1)}%</span>{' '}
                        in cash collected vs last month.
                      </>
                    ) : (
                      <>Not enough payment history in both months to compare yet.</>
                    )}
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-xl border border-border bg-muted/20 p-3 dark:bg-muted/10">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-danger">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-medium text-foreground">Overdue exposure</div>
                  <p className="mt-0.5 text-muted-foreground">
                    {overview.overdueInvoiceCount > 0 ? (
                      <>
                        <span className="font-semibold text-foreground">{overview.overdueInvoiceCount} invoice(s)</span> overdue, worth{' '}
                        <span className="font-semibold text-foreground">{formatMoney(overview.overdueAmount, currency)}</span>.
                      </>
                    ) : (
                      <>No overdue balances right now.</>
                    )}
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-xl border border-border bg-muted/20 p-3 dark:bg-muted/10">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Wallet className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-medium text-foreground">Top paying client</div>
                  <p className="mt-0.5 text-muted-foreground">
                    {insights.topPayingClient ? (
                      <>
                        <span className="font-semibold text-foreground">{insights.topPayingClient.name}</span> —{' '}
                        {formatMoney(insights.topPayingClient.totalPaid, currency)} received (all time).
                      </>
                    ) : (
                      <>Record payments to see who pays you the most.</>
                    )}
                  </p>
                </div>
              </li>
            </ul>
          </Card>

          <Card className="rounded-xl border-border p-4 shadow-[var(--shadow-sm)] sm:p-6">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <p className="text-xs text-muted-foreground">Sends, payments, and reminders from your workspace.</p>
            <ul className="mt-4 max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {activity.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border bg-muted/10 px-3 py-8 text-center text-sm text-muted-foreground">
                  Activity will appear as you send invoices, record payments, and send reminders.
                </li>
              ) : (
                activity.map((item, idx) => {
                  const href =
                    item.invoiceId && !item.invoiceId.startsWith('demo')
                      ? `${routes.app.invoices}/${item.invoiceId}`
                      : null;
                  const inner = (
                    <>
                      <span
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          item.type === 'invoice_sent' && 'bg-primary/12 text-primary',
                          item.type === 'payment_received' && 'bg-success/12 text-success',
                          item.type === 'reminder_sent' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {item.type === 'invoice_sent' ? (
                          <FileText className="h-4 w-4" />
                        ) : item.type === 'payment_received' ? (
                          <Wallet className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {item.type === 'invoice_sent' && 'Invoice sent'}
                            {item.type === 'payment_received' && 'Payment received'}
                            {item.type === 'reminder_sent' && 'Reminder sent'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{formatActivityTime(item.at)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {item.invoiceNumber ?? 'Invoice'} · {item.clientName ?? 'Client'}
                          {item.type === 'payment_received' ? ` · ${formatMoney(item.amount, item.currency)}` : ''}
                          {item.type === 'reminder_sent' ? ` · ${item.channel}` : ''}
                        </p>
                      </div>
                    </>
                  );
                  return (
                    <li key={`${item.type}-${item.at}-${idx}`}>
                      {href ? (
                        <Link
                          href={href}
                          className="flex gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/30"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex gap-3 rounded-xl border border-transparent px-2 py-2">{inner}</div>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_280px]" aria-label="Invoices and quick actions">
          <Card className="rounded-xl border-border shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-sm font-semibold">Recent invoices</h2>
                <p className="text-xs text-muted-foreground">Sort columns · open a row</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="self-start sm:self-auto">
                <Link href={routes.app.invoices}>View all</Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
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
                          className="cursor-pointer"
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
          </Card>

          <Card className="h-fit rounded-xl border-border p-4 shadow-[var(--shadow-sm)] sm:p-5">
            <h2 className="text-sm font-semibold">Quick actions</h2>
            <p className="mt-1 text-xs text-muted-foreground">Common next steps</p>
            <div className="mt-4 flex flex-col gap-2">
              {canMutate ? (
                <>
                  <Button asChild variant="secondary" className="justify-start shadow-none">
                    <Link href={`${routes.app.invoices}/new`}>
                      <FilePlus2 className="h-4 w-4" />
                      Create invoice
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="justify-start shadow-none">
                    <Link href={`${routes.app.clients}/new`}>
                      <UserPlus className="h-4 w-4" />
                      Add client
                    </Link>
                  </Button>
                </>
              ) : null}
              {canMutate ? (
                <Button asChild variant="secondary" className="justify-start shadow-none">
                  <Link href={routes.app.invoices}>
                    <Bell className="h-4 w-4" />
                    Send reminder
                  </Link>
                </Button>
              ) : null}
              {capStatus === 'ready' && !canMutate ? (
                <p className="text-xs text-muted-foreground">Your role is read-only. Quick create and reminders are hidden.</p>
              ) : null}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Open an invoice, use <span className="font-medium text-foreground">Smart reminder</span>, then send from there. Overdue work is
              easiest to find in your invoice list.
            </p>
          </Card>
        </section>
      </div>

      <div className="fixed bottom-5 right-5 z-50 sm:hidden ti-no-print">
        <InvoiceComposerLauncher label="" icon className="h-14 w-14 rounded-full shadow-[var(--shadow-lg)]" />
      </div>
    </AppShell>
  );
}
