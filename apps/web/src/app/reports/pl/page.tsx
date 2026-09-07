'use client';

import { useEffect, useMemo, useState } from 'react';
import { InsightsFilterPills, InsightsWorkspace } from '@/components/insights/InsightsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { formatMoney } from '@/lib/format/money';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { fetchExpensesList } from '@/features/expenses/api';
import type { ExpenseRow } from '@/features/expenses/types';
import { demoInvoicesList } from '@/lib/demo/fixtures';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  expensesInRange,
  percentChange,
  splitExpenses,
  utcMonthBounds,
  utcYtdBounds,
} from '@/lib/insights/profitLoss';
import { cn } from '@/lib/utils/cn';

type Period = 'this_month' | 'last_3_months' | 'ytd' | 'all_time';

type InvoiceCash = { paid: number; currency: string; paidDate: string | null };

function periodWindow(period: Period): { current: { from: string; toExclusive: string; label: string }; previous: { from: string; toExclusive: string; label: string } | null } {
  const thisMonth = utcMonthBounds(0);
  const lastMonth = utcMonthBounds(-1);
  if (period === 'this_month') {
    return { current: thisMonth, previous: lastMonth };
  }
  if (period === 'last_3_months') {
    const start = utcMonthBounds(-2);
    const prevStart = utcMonthBounds(-5);
    return {
      current: { from: start.from, toExclusive: thisMonth.toExclusive, label: 'Last 3 months' },
      previous: { from: prevStart.from, toExclusive: start.from, label: 'Prior 3 months' },
    };
  }
  if (period === 'ytd') {
    const ytd = utcYtdBounds();
    const now = new Date();
    const prevFrom = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)).toISOString().slice(0, 10);
    const prevTo = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    return {
      current: ytd,
      previous: { from: prevFrom, toExclusive: prevTo, label: `${now.getUTCFullYear() - 1} same period` },
    };
  }
  return {
    current: { from: '0000-01-01', toExclusive: '9999-12-32', label: 'All time' },
    previous: null,
  };
}

function inRange(date: string | null, from: string, toExclusive: string) {
  if (!date) return false;
  const d = date.slice(0, 10);
  return d >= from && d < toExclusive;
}

function changeHint(current: number, previous: number | null) {
  if (previous == null) return 'No prior period';
  const pct = percentChange(current, previous);
  if (pct == null) return previous === 0 && current > 0 ? 'New this period' : 'vs prior period';
  if (Math.abs(pct) < 0.5) return 'Flat vs prior period';
  const sign = pct >= 0 ? '+' : '−';
  return `${sign}${Math.abs(Math.round(pct))}% vs prior period`;
}

export default function ProfitLossPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceCash[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [period, setPeriod] = useState<Period>('this_month');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const loadInvoices = async (): Promise<InvoiceCash[]> => {
          const invs: InvoiceCash[] = [];
          if (isDemoUiActive()) {
            for (const row of demoInvoicesList()) {
              invs.push({
                paid: Number(row.paid_amount ?? 0),
                currency: String(row.currency ?? 'ZAR'),
                paidDate: row.paid_amount > 0 ? String(row.issue_date ?? '').slice(0, 10) || null : null,
              });
            }
            return invs;
          }
          const supabase = createSupabaseBrowserClient();
          const ownerId = await getWorkspaceOwnerIdForClient();
          const { data, error: invErr } = await supabase
            .from('invoices')
            .select('paid_amount,currency,status,paid_date,issue_date')
            .eq('owner_id', ownerId);
          if (invErr) throw invErr;
          for (const r of data ?? []) {
            const row = r as any;
            invs.push({
              paid: Number(row.paid_amount ?? 0),
              currency: String(row.currency ?? 'ZAR'),
              paidDate: row.paid_date
                ? String(row.paid_date).slice(0, 10)
                : Number(row.paid_amount) > 0 && row.issue_date
                  ? String(row.issue_date).slice(0, 10)
                  : null,
            });
          }
          return invs;
        };

        const [invs, exp] = await Promise.all([
          loadInvoices(),
          fetchExpensesList().catch(() => ({ items: [] as ExpenseRow[] })),
        ]);
        if (!alive) return;
        setInvoices(invs);
        setExpenses(exp.items ?? []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load P&L.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const currency = invoices[0]?.currency ?? expenses[0]?.currency ?? 'ZAR';
  const periodBounds = periodWindow(period);

  const statement = useMemo(() => {
    const revenueFor = (from: string, toExclusive: string) =>
      invoices.reduce((s, inv) => (inRange(inv.paidDate, from, toExclusive) ? s + inv.paid : s), 0);

    const currentRevenue =
      period === 'all_time'
        ? invoices.reduce((s, inv) => s + inv.paid, 0)
        : revenueFor(periodBounds.current.from, periodBounds.current.toExclusive);
    const currentExp =
      period === 'all_time' ? expenses : expensesInRange(expenses, periodBounds.current.from, periodBounds.current.toExclusive);
    const currentSplit = splitExpenses(currentExp);

    let previous: { revenue: number; costOfSales: number; operating: number; net: number } | null = null;
    if (periodBounds.previous) {
      const prevExp = expensesInRange(expenses, periodBounds.previous.from, periodBounds.previous.toExclusive);
      const prevSplit = splitExpenses(prevExp);
      const prevRev = revenueFor(periodBounds.previous.from, periodBounds.previous.toExclusive);
      previous = {
        revenue: prevRev,
        costOfSales: prevSplit.costOfSales,
        operating: prevSplit.operating,
        net: prevRev - prevSplit.total,
      };
    }

    return {
      revenue: currentRevenue,
      costOfSales: currentSplit.costOfSales,
      operating: currentSplit.operating,
      net: currentRevenue - currentSplit.total,
      previous,
    };
  }, [invoices, expenses, period, periodBounds]);

  const rows = [
    { label: 'Revenue', current: statement.revenue, previous: statement.previous?.revenue ?? null },
    { label: 'Cost of sales', current: statement.costOfSales, previous: statement.previous?.costOfSales ?? null },
    { label: 'Operating expenses', current: statement.operating, previous: statement.previous?.operating ?? null },
    { label: 'Net profit', current: statement.net, previous: statement.previous?.net ?? null, emphasis: true },
  ];

  return (
    <InsightsWorkspace>
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

        <AdminPanel
          kicker="Statement"
          title="Profit & Loss"
          description={`Cash collected versus logged expenses. ${periodBounds.current.label}${
            periodBounds.previous ? ` compared with ${periodBounds.previous.label.toLowerCase()}` : ''
          }.`}
          bodyClassName="mt-0"
          actions={
            <InsightsFilterPills
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'this_month', label: 'This month' },
                { value: 'last_3_months', label: 'Last 3 months' },
                { value: 'ytd', label: 'Year to date' },
                { value: 'all_time', label: 'All time' },
              ]}
            />
          }
        >
          {loading ? (
            <div className="grid gap-3" aria-busy>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)]">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">
                <div>Line</div>
                <div className="text-right">This period</div>
                <div className="min-w-[7.5rem] text-right">Change</div>
              </div>
              {rows.map((row) => (
                <div
                  key={row.label}
                  className={cn(
                    'grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 border-b border-[var(--tl-line)] px-4 py-3.5 last:border-b-0',
                    row.emphasis && 'bg-[color-mix(in_srgb,var(--tl-accent)_6%,white)]'
                  )}
                >
                  <div className={cn('text-[13px]', row.emphasis ? 'font-semibold text-[var(--tl-ink)]' : 'font-medium text-[var(--tl-ink-2)]')}>
                    {row.label}
                  </div>
                  <div className="ti-amount text-right text-[13px] font-semibold">{formatMoney(row.current, currency)}</div>
                  <div className="min-w-[7.5rem] text-right ti-caption text-[var(--tl-ink-3)]">
                    {changeHint(row.current, row.previous)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 ti-caption leading-relaxed text-[var(--tl-ink-3)]">
            Cost of sales includes payroll and equipment. Other logged expenses are treated as operating. Revenue is cash
            collected on invoices in the selected period.
          </p>
        </AdminPanel>
      </div>
    </InsightsWorkspace>
  );
}
