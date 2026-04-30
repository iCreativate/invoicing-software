'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { fetchReports, openReportPrintDialog, reportsToCsv } from '@/features/reports/api';
import type { ReportsPayload } from '@/features/reports/types';
import { FileSpreadsheet, FileText, PieChart } from 'lucide-react';
import { notifySuccess } from '@/lib/notify';

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(id: string): { from: string; to: string } {
  const now = new Date();
  const to = endOfToday();
  switch (id) {
    case 'this_month': {
      const f = startOfMonth(now);
      return { from: iso(f), to };
    }
    case 'ytd': {
      const f = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      return { from: iso(f), to };
    }
    case 'last_12': {
      const f = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
      return { from: iso(f), to };
    }
    case 'this_year': {
      const f = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
      return { from: iso(f), to: iso(end) };
    }
    case 'last_year': {
      const y = now.getUTCFullYear() - 1;
      const f = new Date(Date.UTC(y, 0, 1));
      const end = new Date(Date.UTC(y, 11, 31));
      return { from: iso(f), to: iso(end) };
    }
    default:
      return { from: iso(startOfMonth(now)), to };
  }
}

export default function ReportsClient() {
  const [from, setFrom] = useState(() => presetRange('last_12').from);
  const [to, setTo] = useState(() => presetRange('last_12').to);
  const [currency, setCurrency] = useState('');
  const [revenueView, setRevenueView] = useState<'monthly' | 'yearly'>('monthly');
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await fetchReports({
      from,
      to,
      currency: currency.trim() || null,
    });
    setData(d);
  }, [from, to, currency]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load reports.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const chartData = useMemo(() => {
    if (!data) return [];
    if (revenueView === 'yearly') {
      return data.revenue_yearly.map((r) => ({
        label: r.year,
        invoiced: r.invoiced,
        collected: r.collected,
      }));
    }
    return data.revenue_monthly.map((r) => ({
      label: r.period,
      invoiced: r.invoiced,
      collected: r.collected,
    }));
  }, [data, revenueView]);

  const cur = data?.currency_filter || data?.primary_currency_hint || 'ZAR';

  const onExportCsv = () => {
    if (!data) return;
    const blob = new Blob([reportsToCsv(data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${data.range.from}-${data.range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('CSV downloaded.');
  };

  const onExportPdf = () => {
    if (!data) return;
    openReportPrintDialog(data, 'Analytics report');
  };

  return (
    <AppShell
      title="Reports"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={!data || loading} onClick={onExportCsv}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button type="button" variant="secondary" disabled={!data || loading} onClick={onExportPdf}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold">Filters</div>
          <p className="mt-1 text-sm text-muted-foreground">Date range applies to invoiced activity and payment collections. Outstanding list shows open balances (optionally filtered by currency).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ['this_month', 'This month'],
                ['ytd', 'Year to date'],
                ['last_12', 'Last 12 months'],
                ['this_year', 'This calendar year'],
                ['last_year', 'Last calendar year'],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                variant="secondary"
                className="text-xs"
                onClick={() => {
                  const r = presetRange(id);
                  setFrom(r.from);
                  setTo(r.to);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              From
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              To
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Currency (optional)
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="All currencies"
                maxLength={4}
              />
            </label>
            <div className="flex items-end">
              <Button type="button" className="w-full" disabled={loading} onClick={() => void load()}>
                {loading ? 'Loading…' : 'Apply'}
              </Button>
            </div>
          </div>
          {data?.mixed_currency && !currency.trim() ? (
            <p className="mt-3 text-xs text-amber-800 dark:text-amber-200/90">
              Totals may mix multiple currencies. Set a currency filter for comparable figures.
            </p>
          ) : null}
        </Card>

        {error ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="text-xs font-semibold text-muted-foreground">Invoiced (range)</div>
                <div className="mt-1 text-xl font-bold tabular-nums">{formatMoney(data.totals_in_range.invoiced, cur)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-semibold text-muted-foreground">Collected (payments in range)</div>
                <div className="mt-1 text-xl font-bold tabular-nums">{formatMoney(data.totals_in_range.collected, cur)}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-semibold text-muted-foreground">Tax in range</div>
                <div className="mt-1 text-xl font-bold tabular-nums">{formatMoney(data.tax_summary.tax_amount, cur)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{data.tax_summary.invoice_count} invoice(s)</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-semibold text-muted-foreground">Taxable subtotal</div>
                <div className="mt-1 text-xl font-bold tabular-nums">{formatMoney(data.tax_summary.taxable_subtotal, cur)}</div>
              </Card>
            </div>

            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold">Revenue</div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={revenueView === 'monthly' ? 'primary' : 'secondary'}
                    onClick={() => setRevenueView('monthly')}
                  >
                    Monthly
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={revenueView === 'yearly' ? 'primary' : 'secondary'}
                    onClick={() => setRevenueView('yearly')}
                  >
                    Yearly
                  </Button>
                </div>
              </div>
              <div className="mt-4 h-[320px] w-full min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => String(v)} />
                    <Tooltip
                      formatter={(value) => [formatMoney(Number(value ?? 0), cur), '']}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend />
                    <Bar dataKey="invoiced" name="Invoiced" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <div className="text-sm font-semibold">Top clients</div>
                <p className="mt-1 text-xs text-muted-foreground">By invoiced total in the selected range (excl. draft &amp; cancelled).</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[400px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-muted-foreground">
                        <th className="border-b border-border py-2 pr-2">Client</th>
                        <th className="border-b border-border py-2 text-right">Invoiced</th>
                        <th className="border-b border-border py-2 text-right">Paid on inv.</th>
                        <th className="border-b border-border py-2 text-right">#</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_clients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-muted-foreground">
                            No data in this range.
                          </td>
                        </tr>
                      ) : (
                        data.top_clients.map((c) => (
                          <tr key={c.client_id}>
                            <td className="border-b border-zinc-100 py-2 pr-2 font-medium dark:border-zinc-900">
                              {c.client_name}
                            </td>
                            <td className="border-b border-zinc-100 py-2 text-right tabular-nums dark:border-zinc-900">
                              {formatMoney(c.invoiced, cur)}
                            </td>
                            <td className="border-b border-zinc-100 py-2 text-right tabular-nums dark:border-zinc-900">
                              {formatMoney(c.paid_on_invoices, cur)}
                            </td>
                            <td className="border-b border-zinc-100 py-2 text-right tabular-nums dark:border-zinc-900">
                              {c.invoice_count}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-sm font-semibold">Outstanding invoices</div>
                <p className="mt-1 text-xs text-muted-foreground">Open balances (not draft / cancelled), up to 200 rows.</p>
                <div className="mt-4 max-h-[360px] overflow-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="sticky top-0 bg-card text-left text-xs font-semibold text-muted-foreground">
                        <th className="border-b border-border py-2 pr-2">Invoice</th>
                        <th className="border-b border-border py-2 pr-2">Client</th>
                        <th className="border-b border-border py-2">Due</th>
                        <th className="border-b border-border py-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.outstanding.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-muted-foreground">
                            Nothing outstanding.
                          </td>
                        </tr>
                      ) : (
                        data.outstanding.map((o) => (
                          <tr key={o.invoice_id}>
                            <td className="border-b border-zinc-100 py-2 pr-2 dark:border-zinc-900">
                              <Link className="font-semibold hover:underline" href={`${routes.app.invoices}/${o.invoice_id}`}>
                                {o.invoice_number || o.invoice_id.slice(0, 8)}
                              </Link>
                            </td>
                            <td className="border-b border-zinc-100 py-2 pr-2 text-muted-foreground dark:border-zinc-900">
                              {o.client_name ?? '—'}
                            </td>
                            <td className="border-b border-zinc-100 py-2 tabular-nums dark:border-zinc-900">{o.due_date}</td>
                            <td className="border-b border-zinc-100 py-2 text-right font-semibold tabular-nums dark:border-zinc-900">
                              {formatMoney(o.balance_amount, o.currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        ) : null}

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Profit &amp; loss</div>
              <p className="mt-1 text-sm text-muted-foreground">Compare collected invoice totals to expenses.</p>
              <div className="mt-3">
                <Button asChild variant="secondary">
                  <Link href={routes.app.reportsPl}>Open P&amp;L</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
