'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { StatWidget } from '@/components/dashboard/StatWidget';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { cn } from '@/lib/utils/cn';
import { ArrowUpRight, FilePlus2, Wallet, AlertTriangle, Receipt } from 'lucide-react';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { InvoiceComposerLauncher } from '@/components/invoice/composer/InvoiceComposerLauncher';
import { AskTimelyDrawer } from '@/components/ai/AskTimelyDrawer';

export type DashboardInvoice = {
  id: string;
  invoice_number: string;
  client_name: string | null;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  total_amount: number;
  balance_amount: number;
  paid_amount: number;
};

export type TrendPoint = { date: string; revenue: number; outstanding: number };

export type DashboardData = {
  currency: string;
  revenueMonth: number;
  revenueYtd: number;
  outstanding: number;
  overdueCount: number;
  overdueValue: number;
  recentInvoices: DashboardInvoice[];
  trend: TrendPoint[];
};

function MiniTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
  const out = payload.find((p) => p.dataKey === 'outstanding')?.value ?? 0;
  return (
    <div className="rounded-2xl border border-border bg-popover px-3 py-2 text-xs shadow-[var(--shadow-lg)]">
      <div className="font-semibold">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Revenue</span>
        <span className="font-semibold">{formatMoney(Number(rev), currency)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Outstanding</span>
        <span className="font-semibold">{formatMoney(Number(out), currency)}</span>
      </div>
    </div>
  );
}

export default function DashboardClient({
  userEmail,
  data,
}: {
  userEmail: string | null;
  data: DashboardData;
}) {
  const highlight = useMemo(() => {
    const owed = data.outstanding;
    if (owed <= 0) return { tone: 'success' as const, copy: 'All caught up.' };
    return { tone: 'primary' as const, copy: `You are owed ${formatMoney(owed, data.currency)}` };
  }, [data.currency, data.outstanding]);

  return (
    <AppShell
      title="Dashboard"
      actions={
        <div className="hidden sm:flex items-center gap-2">
          {userEmail ? <Badge variant="outline">{userEmail}</Badge> : null}
          <AskTimelyDrawer />
          <InvoiceComposerLauncher className="shadow-[var(--shadow-lg)]" />
        </div>
      }
    >
      <div className="grid gap-6">
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted-foreground">Cash flow</div>
              <div className="mt-2 text-[34px] leading-[1.05] sm:text-[40px] font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {highlight.copy}
                </span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground max-w-xl">
                Outstanding includes unpaid + overdue balances.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-[360px]">
              <div
                className={cn(
                  'rounded-2xl bg-white/70 p-4 shadow-[var(--shadow-sm)] dark:bg-white/5',
                  highlight.tone === 'success' && 'bg-success/10'
                )}
              >
                <div className="text-xs font-semibold text-muted-foreground">Outstanding</div>
                <div
                  className={cn(
                    'mt-2 text-xl font-semibold tracking-tight',
                    highlight.tone === 'success' ? 'text-success' : 'text-primary'
                  )}
                >
                  {formatMoney(data.outstanding, data.currency)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 shadow-[var(--shadow-sm)] dark:bg-white/5">
                <div className="text-xs font-semibold text-muted-foreground">Overdue</div>
                <div className="mt-2 text-xl font-semibold tracking-tight text-danger">{data.overdueCount}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatMoney(data.overdueValue, data.currency)}</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <StatWidget
            label="Revenue (this month)"
            value={formatMoney(data.revenueMonth, data.currency)}
            hint="Cash collected"
            tone="success"
            icon={<Receipt className="h-4 w-4" />}
          />
          <StatWidget
            label="Revenue (YTD)"
            value={formatMoney(data.revenueYtd, data.currency)}
            hint="Year-to-date"
            tone="success"
            icon={<ArrowUpRight className="h-4 w-4" />}
          />
          <StatWidget
            label="Outstanding"
            value={formatMoney(data.outstanding, data.currency)}
            hint="Unpaid balance"
            tone={data.outstanding > 0 ? 'primary' : 'success'}
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatWidget
            label="Overdue"
            value={`${data.overdueCount}`}
            hint={formatMoney(data.overdueValue, data.currency)}
            tone={data.overdueCount > 0 ? 'danger' : 'default'}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </div>

        <Card className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">AI cash flow forecast</div>
              <div className="mt-1 text-sm text-muted-foreground">
                30 / 60 / 90-day estimate (best effort).
              </div>
            </div>
            <ForecastWidget currency={data.currency} />
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Cash flow trend</div>
                <div className="mt-1 text-sm text-muted-foreground">Last 14 days · revenue vs outstanding</div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Outstanding
                </span>
              </div>
            </div>

            <div className="mt-5 w-full min-w-0 h-44 sm:h-56">
              {data.trend?.length ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={176}>
                  <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="out" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<MiniTooltip currency={data.currency} />} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fill="url(#rev)" strokeWidth={3} />
                    <Area type="monotone" dataKey="outstanding" stroke="hsl(var(--primary))" fill="url(#out)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-2xl bg-muted/20 grid place-items-center text-sm text-muted-foreground">
                  Not enough data yet
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Recent invoices</div>
                <div className="mt-1 text-sm text-muted-foreground">Paid and unpaid</div>
              </div>
              <Link href={routes.app.invoices} className="text-sm font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {data.recentInvoices.length === 0 ? (
                <div className="rounded-2xl bg-white/70 p-6 text-sm text-muted-foreground shadow-[var(--shadow-sm)] dark:bg-white/5">
                  No invoices yet. Create your first invoice.
                </div>
              ) : (
                data.recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={inv.id.startsWith('00000000-0000-0000-0000-') ? '#' : `${routes.app.invoices}/${inv.id}`}
                    className="block rounded-2xl bg-white/70 p-4 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{inv.invoice_number || inv.id.slice(0, 8)}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {inv.client_name ?? '—'} · Due {inv.due_date ?? '—'}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={inv.status} />
                        <div className="text-sm font-semibold">
                          {formatMoney(inv.balance_amount > 0 ? inv.balance_amount : inv.total_amount, inv.currency)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-5 right-5 z-50 sm:hidden">
        <InvoiceComposerLauncher label="" icon className="h-14 w-14 rounded-full shadow-[var(--shadow-lg)]" />
      </div>
    </AppShell>
  );
}

function ForecastWidget({ currency }: { currency: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ days30: number; days60: number; days90: number } | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/cashflow-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: {
            note: 'Provide a rough forecast based on current invoices/payments. If data is missing, make conservative assumptions.',
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error();
      setData(json.data);
    } catch {
      setData({ days30: 0, days60: 0, days90: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className="text-sm font-semibold text-primary hover:underline"
        onClick={run}
        disabled={loading}
      >
        {loading ? 'Forecasting…' : 'Run forecast'}
      </button>
      {data ? (
        <div className="grid grid-cols-3 gap-3 text-right text-sm">
          <div>
            <div className="text-xs text-muted-foreground">30d</div>
            <div className="font-semibold">{formatMoney(Number(data.days30 ?? 0), currency)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">60d</div>
            <div className="font-semibold">{formatMoney(Number(data.days60 ?? 0), currency)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">90d</div>
            <div className="font-semibold">{formatMoney(Number(data.days90 ?? 0), currency)}</div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">Uses AI when configured.</div>
      )}
    </div>
  );
}

