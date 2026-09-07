'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { MoneyCashflowSection } from '@/components/money/MoneyCashflowSection';
import { MoneyAttentionSection } from '@/components/money/MoneyAttentionSection';
import { PageSummary } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { fetchExpensesList } from '@/features/expenses/api';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { Skeleton } from '@/components/ui/Skeleton';

function activityLabel(row: DashboardSummary['activity'][number], currency: string) {
  if (row.type === 'payment_received') {
    return {
      title: 'Payment received',
      detail: `${formatMoney(row.amount, row.currency || currency)}${row.clientName ? ` from ${row.clientName}` : ''}`,
      href: `${routes.app.invoices}/${row.invoiceId}`,
      tone: 'success' as const,
    };
  }
  if (row.type === 'invoice_sent') {
    return {
      title: 'Invoice sent',
      detail: `${row.invoiceNumber ?? 'Invoice'}${row.clientName ? ` · ${row.clientName}` : ''}`,
      href: `${routes.app.invoices}/${row.invoiceId}`,
      tone: 'open' as const,
    };
  }
  return {
    title: 'Reminder sent',
    detail: `${row.invoiceNumber ?? 'Invoice'}${row.clientName ? ` · ${row.clientName}` : ''}`,
    href: `${routes.app.invoices}/${row.invoiceId}`,
    tone: 'warn' as const,
  };
}

function ActivityIcon({ type }: { type: DashboardSummary['activity'][number]['type'] }) {
  if (type === 'payment_received') return <Banknote className="h-3.5 w-3.5" />;
  if (type === 'invoice_sent') return <Receipt className="h-3.5 w-3.5" />;
  return <AlertCircle className="h-3.5 w-3.5" />;
}

function formatActivityDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export default function MoneyOverviewPage() {
  const { canRecordPayments, status: capStatus } = useWorkspaceCapabilities();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevMonthExpenses, setPrevMonthExpenses] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res, expenses] = await Promise.all([
          fetch('/api/dashboard/summary', { credentials: 'include' }),
          fetchExpensesList().catch(() => ({ items: [] as { expenseDate: string; amount: number }[] })),
        ]);
        const json = await res.json();
        if (!cancelled && res.ok && json?.success) setSummary(json.data as DashboardSummary);

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        const prev = (expenses.items ?? [])
          .filter((x) => x.expenseDate >= start && x.expenseDate <= end)
          .reduce((s, x) => s + Number(x.amount ?? 0), 0);
        if (!cancelled) setPrevMonthExpenses(prev);
      } catch {
        // overview still usable without metrics
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = summary?.currency ?? 'ZAR';
  const overview = summary?.overview;
  const collected = overview?.paidThisMonth ?? 0;
  const expenses = overview?.expensesThisMonth ?? 0;
  const net = collected - expenses;
  const cashflow = (summary?.monthlyIncomeVsExpense ?? []).slice(-6);

  const expenseSpike = useMemo(() => {
    if (prevMonthExpenses == null || prevMonthExpenses <= 0 || expenses <= 0) return null;
    const pct = ((expenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    if (pct < 10) return null;
    return pct;
  }, [expenses, prevMonthExpenses]);

  const latestPayment = summary?.activity.find((a) => a.type === 'payment_received');

  const stats = [
    {
      label: 'Outstanding',
      value: loading ? '—' : formatMoney(overview?.outstandingAmount ?? 0, currency),
      trend: `${overview?.outstandingInvoiceCount ?? 0} open invoices`,
      href: routes.app.invoices,
      icon: Wallet,
    },
    {
      label: 'Overdue',
      value: loading ? '—' : formatMoney(overview?.overdueAmount ?? 0, currency),
      trend: `${overview?.overdueInvoiceCount ?? 0} invoices`,
      href: routes.app.collections,
      icon: AlertCircle,
      trendDown: (overview?.overdueAmount ?? 0) > 0,
    },
    {
      label: 'Collected',
      value: loading ? '—' : formatMoney(collected, currency),
      trend: 'This month',
      href: routes.app.payments,
      icon: Banknote,
      trendUp: true,
    },
    {
      label: 'Expenses',
      value: loading ? '—' : formatMoney(expenses, currency),
      trend: 'This month',
      href: routes.app.expenses,
      icon: Receipt,
    },
    {
      label: 'Net',
      value: loading ? '—' : formatMoney(net, currency),
      trend: 'Collected − spend',
      href: routes.app.reportsPl,
      icon: TrendingUp,
      trendUp: net >= 0,
    },
  ];

  return (
    <MoneyWorkspace
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {capStatus === 'ready' && canRecordPayments ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={routes.app.payments}>Record payment</Link>
            </Button>
          ) : null}
          <InvoiceComposerLauncher label="New invoice" />
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        <PageSummary>
          <MoneyKpiGrid cols={5} aria-label="Financial snapshot">
            {stats.map((kpi) => (
              <MoneyKpiCard
                key={kpi.label}
                icon={kpi.icon}
                label={kpi.label}
                value={kpi.value}
                trend={kpi.trend}
                trendUp={'trendUp' in kpi ? kpi.trendUp : undefined}
                trendDown={'trendDown' in kpi ? kpi.trendDown : undefined}
                href={kpi.href}
              />
            ))}
          </MoneyKpiGrid>
        </PageSummary>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <MoneyCashflowSection rows={cashflow} currency={currency} loading={loading} />

            <Surface variant="elevated" className="ti-panel flex min-h-0 flex-1 flex-col">
              <div className="ti-panel-head">
                <SectionHeader
                  kicker="Recent activity"
                  title="Latest movement"
                  description="Tap a row to open the related invoice."
                />
              </div>
              {!loading && (summary?.activity.length ?? 0) === 0 ? (
                <p className="mt-3 ti-small text-[var(--tl-ink-3)]">
                  Payments and invoice activity will appear here.
                </p>
              ) : loading ? (
                <div className="ti-activity-list mt-1" aria-busy>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="ti-activity-row pointer-events-none">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-[0.65rem]" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="ti-activity-list mt-1">
                  {(summary?.activity ?? []).slice(0, 6).map((row, i) => {
                    const item = activityLabel(row, currency);
                    return (
                      <li key={`${row.type}-${row.at}-${i}`}>
                        <Link
                          href={item.href}
                          className="ti-activity-row"
                          data-tone={item.tone}
                        >
                          <span className="ti-activity-icon" aria-hidden>
                            <ActivityIcon type={row.type} />
                          </span>
                          <span className="ti-activity-copy min-w-0 flex-1">
                            <span className="ti-activity-title">{item.title}</span>
                            <span className="ti-activity-detail">{item.detail}</span>
                          </span>
                          <span className="ti-activity-meta">
                            <span className="ti-activity-date">{formatActivityDate(row.at)}</span>
                            <ArrowRight className="ti-activity-chevron h-3.5 w-3.5" aria-hidden />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Surface>
          </div>

          <MoneyAttentionSection
            loading={loading}
            currency={currency}
            overview={overview}
            expenseSpike={expenseSpike}
            latestPayment={
              latestPayment && latestPayment.type === 'payment_received' ? latestPayment : undefined
            }
          />
        </div>
      </div>
    </MoneyWorkspace>
  );
}
