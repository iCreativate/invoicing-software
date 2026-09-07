'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { InsightsFilterPills, InsightsWorkspace } from '@/components/insights/InsightsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { PageSummary } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMoney } from '@/lib/format/money';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { fetchExpensesList } from '@/features/expenses/api';
import type { ExpenseRow } from '@/features/expenses/types';
import { routes } from '@/lib/routing/routes';
import { themeTokens } from '@/theme/tokens';
import { ArrowDownLeft, ArrowUpRight, LineChart as LineChartIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type RangeKey = '7' | '30' | '90' | '12m';

type Forecast = {
  days30: number;
  days60: number;
  days90: number;
  assumptions: string[];
};

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function CashflowPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('30');
  const [forecast, setForecast] = useState<Forecast | null>(null);
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
  }, [summary, range]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res, exp] = await Promise.all([
          fetch('/api/dashboard/summary', { credentials: 'include' }),
          fetchExpensesList().catch(() => ({ items: [] as ExpenseRow[] })),
        ]);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to load cashflow');
        if (!cancelled) {
          setSummary(json.data as DashboardSummary);
          setExpenses(exp.items ?? []);
        }

        try {
          const aiRes = await fetch('/api/ai/cashflow-forecast', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: json.data }),
          });
          const aiJson = await aiRes.json();
          if (!cancelled && aiRes.ok && aiJson?.success && aiJson.data) {
            const d = aiJson.data as Forecast;
            if (typeof d.days30 === 'number') setForecast(d);
          }
        } catch {
          // deterministic forecast below
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = summary?.currency ?? 'ZAR';

  const fallbackForecast = useMemo<Forecast | null>(() => {
    if (!summary) return null;
    const days30 = summary.expectedIncoming + summary.overview.overdueAmount * 0.35;
    return {
      days30,
      days60: days30 + summary.overview.outstandingAmount * 0.25,
      days90: days30 + summary.overview.outstandingAmount * 0.4,
      assumptions: [
        'Based on invoices due in the next 14 days and a share of overdue balances.',
        'Actual receipts depend on client payment behaviour.',
      ],
    };
  }, [summary]);

  const shownForecast = forecast ?? fallbackForecast;

  const { chartData, incoming, outgoing, isMonthly } = useMemo(() => {
    if (!summary) return { chartData: [] as { label: string; incoming: number; outgoing: number; net: number }[], incoming: 0, outgoing: 0, isMonthly: false };

    if (range === '12m') {
      const chartData = summary.monthlyIncomeVsExpense.map((m) => ({
        label: m.label,
        incoming: m.income,
        outgoing: m.expense,
        net: m.income - m.expense,
      }));
      return {
        chartData,
        incoming: chartData.reduce((s, r) => s + r.incoming, 0),
        outgoing: chartData.reduce((s, r) => s + r.outgoing, 0),
        isMonthly: true,
      };
    }

    const days = Number(range);
    const from = isoDaysAgo(days - 1);
    const rows = (summary.revenueByDay ?? []).filter((d) => d.date >= from);
    const expByDay = new Map<string, number>();
    for (const e of expenses) {
      const day = e.expenseDate.slice(0, 10);
      if (day >= from) expByDay.set(day, (expByDay.get(day) ?? 0) + e.amount);
    }
    const chartData = rows.map((r) => {
      const out = expByDay.get(r.date) ?? 0;
      return { label: r.label, incoming: r.amount, outgoing: out, net: r.amount - out };
    });
    return {
      chartData,
      incoming: chartData.reduce((s, r) => s + r.incoming, 0),
      outgoing: chartData.reduce((s, r) => s + r.outgoing, 0),
      isMonthly: false,
    };
  }, [summary, expenses, range]);

  const net = incoming - outgoing;
  const hasSeries = chartData.some((d) => d.incoming > 0 || d.outgoing > 0);

  const summaryCards = [
    {
      label: 'Incoming',
      value: formatMoney(incoming, currency),
      trend: isMonthly ? '12 months collected' : `${range}d collected`,
      icon: ArrowDownLeft,
      href: routes.app.payments,
    },
    {
      label: 'Outgoing',
      value: formatMoney(outgoing, currency),
      trend: isMonthly ? '12 months expenses' : `${range}d expenses`,
      icon: ArrowUpRight,
      href: routes.app.expenses,
    },
    {
      label: 'Net cashflow',
      value: formatMoney(net, currency),
      trend: 'Incoming − outgoing',
      icon: LineChartIcon,
      href: routes.app.reportsPl,
      trendUp: net >= 0,
    },
    {
      label: 'Forecast',
      value: shownForecast != null && Number.isFinite(shownForecast.days30)
        ? formatMoney(shownForecast.days30, currency)
        : '—',
      trend: 'Expected in the next 30 days',
      icon: Sparkles,
      href: '#cashflow-forecast',
    },
  ] as const;

  return (
    <InsightsWorkspace>
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-busy>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-[var(--tl-radius-sm)]" />
            ))}
          </div>
        ) : null}
        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

        {summary ? (
          <>
            <PageSummary>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Cashflow summary">
              {summaryCards.map((m) => {
                const Icon = m.icon;
                const card = (
                  <>
                    <span className="ti-kpi-icon" aria-hidden>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="ti-kpi-value">{m.value}</span>
                    <span className="ti-kpi-label">{m.label}</span>
                    <span
                      className={cn(
                        'ti-kpi-trend',
                        'trendUp' in m && m.trendUp === true && 'ti-kpi-trend-up',
                        'trendUp' in m && m.trendUp === false && 'ti-kpi-trend-down'
                      )}
                    >
                      {m.trend}
                    </span>
                  </>
                );

                return m.href.startsWith('#') ? (
                  <a
                    key={m.label}
                    href={m.href}
                    className="ti-kpi-card outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]"
                  >
                    {card}
                  </a>
                ) : (
                  <Link
                    key={m.label}
                    href={m.href}
                    className="ti-kpi-card outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--tl-accent)]"
                  >
                    {card}
                  </Link>
                );
              })}
              </div>
            </PageSummary>

            <AdminPanel
              kicker={isMonthly ? 'Monthly cashflow' : 'Daily cashflow'}
              description="Incoming collections versus outgoing expenses."
              className="flex min-h-0 flex-1 flex-col"
              bodyClassName="mt-0 min-h-0 flex-1"
              actions={
                <InsightsFilterPills
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: '7', label: '7 days' },
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: '12m', label: '12 months' },
                  ]}
                />
              }
            >
              <div ref={chartRef} className="relative h-[16rem] w-full min-w-0 sm:h-[18rem]">
                {hasSeries ? (
                  chartBox ? (
                    <LineChart
                      width={chartBox.w}
                      height={chartBox.h}
                      data={chartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke={themeTokens.chart.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: themeTokens.chart.axis }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(v, name) => [formatMoney(Number(v ?? 0), currency), String(name)]}
                        contentStyle={{
                          borderRadius: 8,
                          border: `1px solid ${themeTokens.colors.border}`,
                          background: themeTokens.colors.surface,
                          boxShadow: themeTokens.shadows.softMd,
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="incoming"
                        name="Incoming"
                        stroke={themeTokens.chart.collected}
                        strokeWidth={2.25}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="outgoing"
                        name="Outgoing"
                        stroke={themeTokens.chart.overdue}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                      />
                    </LineChart>
                  ) : null
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[var(--tl-radius-sm)] border border-dashed border-[var(--tl-line)] ti-body text-[var(--tl-ink-3)]">
                    No cash movement in this window.
                  </div>
                )}
              </div>
            </AdminPanel>

            {shownForecast ? (
              <AdminPanel
                kicker="Forecast"
                description="Expected inflows if open invoices are collected on time."
                className="scroll-mt-4"
                bodyClassName="mt-0"
              >
                <div id="cashflow-forecast" className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ['30 days', shownForecast.days30],
                      ['60 days', shownForecast.days60],
                      ['90 days', shownForecast.days90],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="ti-kpi-card">
                      <span className="ti-kpi-label">{label}</span>
                      <span className="ti-kpi-value">{formatMoney(Number(value) || 0, currency)}</span>
                    </div>
                  ))}
                </div>
                {shownForecast.assumptions?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 ti-caption text-[var(--tl-ink-3)]">
                    {shownForecast.assumptions.slice(0, 3).map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                ) : null}
              </AdminPanel>
            ) : null}
          </>
        ) : null}
      </div>
    </InsightsWorkspace>
  );
}
