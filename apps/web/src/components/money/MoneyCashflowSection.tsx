'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { AdminPanel } from '@/components/workspace/workspace-ui';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Amount } from '@/components/ui/Text';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { themeTokens } from '@/theme/tokens';
import { cn } from '@/lib/utils/cn';

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-[var(--tl-ink-2)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

type CashflowRow = { label: string; income: number; expense: number };

export function MoneyCashflowSection({
  rows,
  currency,
  loading,
}: {
  rows: CashflowRow[];
  currency: string;
  loading: boolean;
}) {
  const totals = useMemo(() => {
    const income = rows.reduce((s, r) => s + r.income, 0);
    const expense = rows.reduce((s, r) => s + r.expense, 0);
    return { income, expense, net: income - expense };
  }, [rows]);

  const barData = useMemo(
    () =>
      rows.map((d) => ({
        ...d,
        tick: d.label.length > 3 ? d.label.slice(0, 3) : d.label,
      })),
    [rows]
  );

  const hasChart = barData.some((d) => d.income > 0 || d.expense > 0);

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
  }, [rows, loading]);

  return (
    <AdminPanel
      kicker="Cashflow"
      title="Last 6 months"
      description="Collected vs expenses by month."
      actions={
        <Button asChild size="sm" variant="secondary">
          <Link href={routes.app.cashflow}>
            Full cashflow
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-6" aria-busy>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-[var(--tl-radius-sm)]" />
            ))}
          </div>
          <Skeleton className="h-60 w-full rounded-[var(--tl-radius-sm)] sm:h-72" />
        </div>
      ) : rows.length === 0 || !hasChart ? (
        <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-[var(--tl-radius-sm)] border border-dashed border-[var(--tl-line)] bg-[var(--tl-bg)] px-6 py-10 text-center">
          <p className="ti-body text-[var(--tl-ink-2)]">Not enough history yet.</p>
          <p className="mt-1 ti-caption text-[var(--tl-ink-3)]">
            Send invoices and record expenses to build this chart.
          </p>
          <div className="mt-4">
            <Button asChild variant="secondary" size="sm">
              <Link href={routes.app.invoices}>View invoices</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-7">
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                { label: 'Collected', value: formatMoney(totals.income, currency), hint: '6-month total' },
                { label: 'Expenses', value: formatMoney(totals.expense, currency), hint: '6-month total' },
                {
                  label: 'Net',
                  value: formatMoney(totals.net, currency),
                  hint: 'Collected − expenses',
                  accent: totals.net >= 0 ? ('success' as const) : ('danger' as const),
                },
              ] as const
            ).map((item) => (
              <div
                key={item.label}
                className="flex min-h-[6.5rem] flex-col justify-center rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-5 py-4 sm:py-5"
              >
                <div className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">
                  {item.label}
                </div>
                <Amount
                  display
                  className={cn(
                    'mt-2 !text-[clamp(1.1rem,1.8vw,1.35rem)] leading-tight',
                    'accent' in item && item.accent === 'success' && 'text-[var(--tl-success)]',
                    'accent' in item && item.accent === 'danger' && 'text-[var(--tl-danger)]'
                  )}
                >
                  {item.value}
                </Amount>
                <p className="mt-2 ti-caption leading-relaxed text-[var(--tl-ink-3)]">{item.hint}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--tl-line)] pt-5 sm:pt-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <LegendSwatch color={themeTokens.chart.collected} label="Collected" />
              <LegendSwatch color={themeTokens.chart.expected} label="Expenses" />
            </div>

            <div ref={chartRef} className="relative mt-5 h-60 w-full min-w-0 overflow-hidden sm:mt-6 sm:h-72">
              {chartBox ? (
                <BarChart
                  width={chartBox.w}
                  height={chartBox.h}
                  data={barData}
                  margin={{ top: 12, right: 8, left: 0, bottom: 8 }}
                  barGap={6}
                  barCategoryGap="32%"
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
                <Bar dataKey="income" name="Collected" fill={themeTokens.chart.collected} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" name="Expenses" fill={themeTokens.chart.expected} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            ) : null}
            </div>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}
