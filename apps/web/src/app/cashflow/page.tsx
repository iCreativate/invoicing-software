'use client';

import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/dashboard-ui/GlassCard';
import { PageHeader } from '@/components/dashboard-ui/PageHeader';
import { formatMoney } from '@/lib/format/money';
import type { DashboardSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils/cn';
import { themeTokens } from '@/theme/tokens';

export default function CashflowPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/summary', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Failed to load cashflow');
        if (!cancelled) setSummary(json.data as DashboardSummary);
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
  const lineData = useMemo(() => {
    const rows = summary?.revenueByDay ?? [];
    return rows.slice(-days);
  }, [summary, days]);

  const windowTotal = lineData.reduce((s, d) => s + d.amount, 0);

  return (
    <AppShell title="Cashflow">
      <PageBody>
        <PageHeader title="Cashflow" description="Cash collected from completed payments in your workspace." />

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {summary ? (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Paid this month </span>
                <span className="ti-num font-semibold">{formatMoney(summary.overview.paidThisMonth, currency)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Outstanding </span>
                <span className="ti-num font-semibold">{formatMoney(summary.overview.outstandingAmount, currency)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Expected (14d) </span>
                <span className="ti-num font-semibold">{formatMoney(summary.expectedIncoming, currency)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Expenses (MTD) </span>
                <span className="ti-num font-semibold">{formatMoney(summary.overview.expensesThisMonth, currency)}</span>
              </div>
            </div>

            <GlassCard className="mt-4 flex min-h-0 flex-1 flex-col p-4 sm:p-6">
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Daily collections</h2>
                  <p className="text-xs text-muted-foreground">
                    {days}d total · {formatMoney(windowTotal, currency)}
                  </p>
                </div>
                <div className="flex gap-0.5 rounded-[var(--ti-radius-sm)] border border-border bg-muted/40 p-0.5">
                  {([7, 30, 90] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays(d)}
                      className={cn(
                        'rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                        days === d
                          ? 'bg-card text-foreground shadow-[var(--ti-shadow)]'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 h-[16rem] w-full min-w-0">
                {lineData.some((d) => d.amount > 0) ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160} debounce={50}>
                    <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                        formatter={(v) => formatMoney(Number(v ?? 0), currency)}
                        contentStyle={{
                          borderRadius: 8,
                          border: `1px solid ${themeTokens.colors.border}`,
                          background: themeTokens.colors.surface,
                          boxShadow: themeTokens.shadows.softMd,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke={themeTokens.chart.collected}
                        strokeWidth={2.25}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[var(--ti-radius)] border border-dashed border-border text-sm text-muted-foreground">
                    No payments in this window.
                  </div>
                )}
              </div>
            </GlassCard>
          </>
        ) : null}
      </PageBody>
    </AppShell>
  );
}
