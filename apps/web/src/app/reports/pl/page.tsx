'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { fetchExpensesList } from '@/features/expenses/api';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProfitLossPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [currency, setCurrency] = useState('ZAR');
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [expenseCurrency, setExpenseCurrency] = useState('ZAR');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createSupabaseBrowserClient();
        const ownerId = await getWorkspaceOwnerIdForClient();

        const { data: invs, error: invErr } = await supabase
          .from('invoices')
          .select('paid_amount,currency,status')
          .eq('owner_id', ownerId);
        if (invErr) throw invErr;

        let rev = 0;
        let cur = 'ZAR';
        for (const r of invs ?? []) {
          const row = r as any;
          rev += Number(row.paid_amount ?? 0);
          if (row.currency) cur = String(row.currency);
        }
        if (!alive) return;
        setRevenue(rev);
        setCurrency(cur);

        try {
          const { items: ex } = await fetchExpensesList();
          if (!alive) return;
          const t = ex.reduce((s, x) => s + x.amount, 0);
          setExpensesTotal(t);
          setExpenseCurrency(ex[0]?.currency ?? cur);
        } catch {
          setExpensesTotal(0);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load P&L.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const profit = useMemo(() => revenue - expensesTotal, [revenue, expensesTotal]);

  return (
    <AppShell
      title="Profit & loss"
      actions={
        <Link href={routes.app.reports}>
          <Button variant="secondary">Reports</Button>
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 md:col-span-3">
          {error ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {loading ? (
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-muted/20 p-4 motion-safe:animate-[ti-fade-up_0.4s_ease-out_both]">
                <div className="text-xs font-semibold text-muted-foreground">Revenue (cash collected)</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(revenue, currency)}</div>
                <p className="mt-2 text-xs text-muted-foreground">Sum of paid_amount on your invoices. FX normalization coming.</p>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4 motion-safe:animate-[ti-fade-up_0.45s_ease-out_both]">
                <div className="text-xs font-semibold text-muted-foreground">Expenses</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{formatMoney(expensesTotal, expenseCurrency)}</div>
                <p className="mt-2 text-xs text-muted-foreground">Logged in Expenses. Multi-currency rollups use company base currency next.</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-4 motion-safe:animate-[ti-fade-up_0.5s_ease-out_both]">
                <div className="text-xs font-semibold text-muted-foreground">Net (simple)</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatMoney(profit, currency)}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Revenue minus expenses (same-currency approximation).</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
