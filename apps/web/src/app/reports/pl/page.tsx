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
import { isDemoUiActive } from '@/lib/demo/accounts';
import { fetchExpensesList } from '@/features/expenses/api';
import { demoInvoicesList } from '@/lib/demo/fixtures';
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

        let rev = 0;
        let cur = 'ZAR';
        if (isDemoUiActive()) {
          for (const row of demoInvoicesList()) {
            rev += Number(row.paid_amount ?? 0);
            if (row.currency) cur = String(row.currency);
          }
        } else {
          const supabase = createSupabaseBrowserClient();
          const ownerId = await getWorkspaceOwnerIdForClient();
          const { data: invs, error: invErr } = await supabase
            .from('invoices')
            .select('paid_amount,currency,status')
            .eq('owner_id', ownerId);
          if (invErr) throw invErr;
          for (const r of invs ?? []) {
            const row = r as any;
            rev += Number(row.paid_amount ?? 0);
            if (row.currency) cur = String(row.currency);
          }
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
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 md:grid md:grid-cols-3">
        <Card className="flex min-h-0 flex-1 flex-col overflow-auto p-5 md:col-span-3">
          {error ? <div className="rounded-[var(--ti-radius)] border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {loading ? (
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="ti-surface rounded-[var(--ti-radius)] bg-muted/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Revenue (cash collected)</div>
                <div className="ti-num mt-2 text-2xl font-semibold">{formatMoney(revenue, currency)}</div>
                <p className="mt-2 text-xs text-muted-foreground">Sum of paid_amount on your invoices. FX normalization coming.</p>
              </div>
              <div className="ti-surface rounded-[var(--ti-radius)] bg-muted/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Expenses</div>
                <div className="ti-num mt-2 text-2xl font-semibold">{formatMoney(expensesTotal, expenseCurrency)}</div>
                <p className="mt-2 text-xs text-muted-foreground">Logged in Expenses. Multi-currency rollups use company base currency next.</p>
              </div>
              <div className="ti-surface rounded-[var(--ti-radius)] border-[var(--ti-brand-accent,#2F6F7E)]/25 bg-[var(--ti-brand-accent,#2F6F7E)]/[0.06] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Net (simple)</div>
                <div className="ti-num mt-2 text-2xl font-semibold">
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
