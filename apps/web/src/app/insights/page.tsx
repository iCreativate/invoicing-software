'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertCircle,
  ArrowRight,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { InsightsWorkspace } from '@/components/insights/InsightsWorkspace';
import { AdminPanel } from '@/components/workspace/workspace-ui';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format/money';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { buildFeaturedInsight, buildTimelyInsights } from '@/lib/insights/buildTimelyInsights';
import { routes } from '@/lib/routing/routes';
import { themeTokens } from '@/theme/tokens';
import { cn } from '@/lib/utils/cn';

function deltaLabel(current: number, previous: number | null | undefined) {
  if (previous == null || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (!Number.isFinite(pct) || Math.abs(pct) < 0.5) return null;
  const sign = pct >= 0 ? '+' : '−';
  return `${sign}${Math.abs(Math.round(pct))}% vs last month`;
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--tl-ink-2)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

export default function InsightsOverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState<'6' | '12'>('6');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/summary', { credentials: 'include' });
        const json = await res.json();
        if (!cancelled && res.ok && json?.success) setSummary(json.data as DashboardSummary);
      } catch {
        // overview still usable
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
  const months = summary?.monthlyIncomeVsExpense ?? [];
  const prev = months.length >= 2 ? months[months.length - 2] : null;
  const revenue = overview?.paidThisMonth ?? 0;
  const expenses = overview?.expensesThisMonth ?? 0;
  const profit = revenue - expenses;
  const prevProfit = prev ? prev.income - prev.expense : null;
  const collectionRate = summary?.businessPulse.collectionRatePercent ?? null;
  const prevCollection =
    collectionRate != null && summary?.businessPulse.collectionRateDelta != null
      ? collectionRate - summary.businessPulse.collectionRateDelta
      : null;

  const featured = useMemo(() => (summary ? buildFeaturedInsight(summary) : null), [summary]);
  const insights = useMemo(() => (summary ? buildTimelyInsights(summary) : []), [summary]);

  const collectedLifetime = summary?.paidVsUnpaid.find((s) => s.key === 'paid')?.value ?? 0;
  const outstanding = overview?.outstandingAmount ?? 0;
  const overdue = overview?.overdueAmount ?? 0;

  const barData = useMemo(() => {
    const slice = chartRange === '6' ? months.slice(-6) : months;
    return slice.map((d) => ({
      ...d,
      tick: d.label.length > 3 ? d.label.slice(0, 3) : d.label,
    }));
  }, [months, chartRange]);

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

  const revenueTrend = deltaLabel(revenue, prev?.income);
  const expenseTrend = deltaLabel(expenses, prev?.expense);
  const profitTrend = prevProfit != null ? deltaLabel(profit, prevProfit) : null;

  const kpis = [
    {
      href: routes.app.payments,
      icon: TrendingUp,
      label: 'Revenue',
      value: loading ? '—' : formatMoney(revenue, currency),
      trend: revenueTrend ?? 'Collected this month',
      trendUp: revenueTrend?.startsWith('+') ? true : revenueTrend?.startsWith('−') ? false : undefined,
    },
    {
      href: routes.app.expenses,
      icon: TrendingDown,
      label: 'Expenses',
      value: loading ? '—' : formatMoney(expenses, currency),
      trend: expenseTrend ?? 'Recorded this month',
      trendUp: expenseTrend?.startsWith('−') ? true : expenseTrend?.startsWith('+') ? false : undefined,
    },
    {
      href: routes.app.reportsPl,
      icon: Wallet,
      label: 'Profit',
      value: loading ? '—' : formatMoney(profit, currency),
      trend: profitTrend ?? 'Revenue − expenses',
      trendUp: profitTrend?.startsWith('+') ? true : profitTrend?.startsWith('−') ? false : undefined,
    },
    {
      href: routes.app.invoices,
      icon: AlertCircle,
      label: 'Outstanding',
      value: loading ? '—' : formatMoney(outstanding, currency),
      trend: `${overview?.outstandingInvoiceCount ?? 0} open`,
      trendDown: overdue > 0,
    },
    {
      href: routes.app.collections,
      icon: Percent,
      label: 'Collection rate',
      value: loading ? '—' : collectionRate != null ? `${Math.round(collectionRate)}%` : '—',
      trend: prevCollection != null ? `Was ${Math.round(prevCollection)}%` : 'Invoiced work collected',
    },
  ] as const;

  const cashRows = [
    { label: 'Collected (lifetime)', amount: collectedLifetime, danger: false },
    { label: 'Outstanding', amount: outstanding, danger: false },
    { label: 'Of which overdue', amount: overdue, danger: true },
  ] as const;

  return (
    <InsightsWorkspace>
      <div className="flex flex-col gap-4 md:gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Key metrics">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="ti-kpi-card outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]"
            >
              <span className="ti-kpi-icon" aria-hidden>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{kpi.value}</span>
              <span className="ti-kpi-label">{kpi.label}</span>
              <span
                className={cn(
                  'ti-kpi-trend',
                  'trendUp' in kpi && kpi.trendUp === true && 'ti-kpi-trend-up',
                  'trendUp' in kpi && kpi.trendUp === false && 'ti-kpi-trend-down',
                  'trendDown' in kpi && kpi.trendDown && 'ti-kpi-trend-down'
                )}
              >
                {kpi.trend}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <AdminPanel
          kicker="What happened"
          description="Collected vs expenses by month"
          className="flex flex-col"
          bodyClassName="mt-0"
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
        >
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <LegendSwatch color={themeTokens.chart.collected} label="Collected" />
            <LegendSwatch color={themeTokens.chart.expected} label="Expenses" />
          </div>

          <div ref={chartRef} className="relative mt-5 h-64 w-full min-w-0 overflow-hidden sm:h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-full w-full rounded-[var(--tl-radius-sm)]" />
              </div>
            ) : hasChart ? (
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
                <p className="ti-body text-[var(--tl-ink-2)]">Not enough history yet.</p>
                <div className="mt-4">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={routes.app.invoices}>View invoices</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel kicker="Cash position" description="Collected vs still owed" bodyClassName="mt-0">
          <ul className="space-y-4" role="list">
            {cashRows.map((row) => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-[var(--tl-ink-2)]">{row.label}</span>
                  <span
                    className={cn(
                      'ti-amount text-[13px] font-semibold',
                      row.danger && row.amount > 0 && 'text-[var(--tl-danger)]'
                    )}
                  >
                    {loading ? '—' : formatMoney(row.amount, currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {featured && !loading ? (
            <div className="mt-6 border-t border-[var(--tl-line)] pt-5">
              <p className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Headline</p>
              <p className="mt-2 text-[13px] font-semibold leading-snug text-[var(--tl-ink)]">{featured.happening}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--tl-ink-2)]">{featured.why}</p>
            </div>
          ) : loading ? (
            <div className="mt-6 space-y-2 border-t border-[var(--tl-line)] pt-5" aria-busy>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : null}
        </AdminPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <AdminPanel kicker="Why" description="The drivers behind your numbers." bodyClassName="mt-0">
          {featured ? (
            <div>
              <p className="ti-body font-medium leading-snug text-[var(--tl-ink)]">{featured.happening}</p>
              <p className="mt-3 max-w-2xl ti-body leading-relaxed text-[var(--tl-ink-2)]">{featured.why}</p>
            </div>
          ) : loading ? (
            <div className="space-y-2" aria-busy>
              <Skeleton className="h-5 w-full max-w-xl" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
          ) : (
            <p className="ti-body text-[var(--tl-ink-3)]">Not enough data to explain trends yet.</p>
          )}

          {insights.length > 1 ? (
            <ul className="mt-4 divide-y divide-[var(--tl-line)] border-t border-[var(--tl-line)]" role="list">
              {insights.slice(1).map((item) => (
                <li key={item.id} className="py-4">
                  <p className="text-[13px] font-semibold leading-relaxed text-[var(--tl-ink)]">{item.happening}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--tl-ink-2)]">{item.why}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </AdminPanel>

        <AdminPanel
          kicker="What should I do"
          description="Recommended actions from your data."
          bodyClassName="mt-0"
        >
          {featured ? (
            <div className="flex flex-col gap-2.5">
              <Link href={featured.href} className="ti-quick-action">
                <ArrowRight className="h-3.5 w-3.5" />
                {featured.actionLabel}
              </Link>
              {insights.map((item) => (
                <Link key={item.id} href={item.href} className="ti-quick-action">
                  <ArrowRight className="h-3.5 w-3.5" />
                  {item.actionLabel}
                </Link>
              ))}
            </div>
          ) : loading ? (
            <div className="space-y-2" aria-busy>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <p className="ti-body text-[var(--tl-ink-3)]">No recommendations yet — keep sending invoices.</p>
          )}

          {featured ? (
            <p className="mt-5 border-t border-[var(--tl-line)] pt-4 text-[12.5px] leading-relaxed text-[var(--tl-ink-2)]">
              {featured.next}
            </p>
          ) : null}
        </AdminPanel>
      </div>
      </div>
    </InsightsWorkspace>
  );
}
