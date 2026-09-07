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
import { InsightsWorkspace } from '@/components/insights/InsightsWorkspace';
import { AdminAlertBanner, AdminPanel, AdminStatusCard } from '@/components/workspace/workspace-ui';
import { PageSummary } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { fetchReports, openReportPrintDialog, reportsToCsv } from '@/features/reports/api';
import type { ReportsPayload } from '@/features/reports/types';
import { Banknote, FileSpreadsheet, FileText, Percent, Receipt } from 'lucide-react';
import { notifySuccess } from '@/lib/notify';
import { themeTokens } from '@/theme/tokens';

const REPORT_LIBRARY = [
  { id: 'report-revenue', label: 'Revenue', description: 'Invoiced vs collected over time.' },
  { id: 'report-tax', label: 'Tax', description: 'VAT in the selected range.' },
  { id: 'report-clients', label: 'Clients', description: 'Who you billed the most.' },
  { id: 'report-outstanding', label: 'Outstanding', description: 'Open balances still to collect.' },
] as const;

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
    <InsightsWorkspace
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
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 md:gap-5">
        <AdminPanel kicker="Report library" description="Open a report below. Filters apply to all of them." bodyClassName="mt-0">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REPORT_LIBRARY.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="block transition-opacity hover:opacity-90">
                  <AdminStatusCard title={item.label} description={item.description} badge="Open" badgeTone="outline" />
                </a>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel
          kicker="Filters"
          description="Date range applies to invoiced activity and payment collections. Outstanding list shows open balances (optionally filtered by currency)."
          bodyClassName="mt-0"
        >
          <div className="ti-pill-track">
              {(
                [
                  ['this_month', 'This month'],
                  ['ytd', 'Year to date'],
                  ['last_12', 'Last 12 months'],
                  ['this_year', 'This calendar year'],
                  ['last_year', 'Last calendar year'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className="ti-pill ti-pill-idle"
                  onClick={() => {
                    const r = presetRange(id);
                    setFrom(r.from);
                    setTo(r.to);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="From" htmlFor="report-from">
              <Input id="report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To" htmlFor="report-to">
              <Input id="report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Currency (optional)" htmlFor="report-currency" hint="Leave blank to include all currencies.">
              <Input
                id="report-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="All currencies"
                maxLength={4}
              />
            </Field>
            <div className="flex items-end">
              <Button type="button" className="w-full" disabled={loading} onClick={() => void load()}>
                {loading ? 'Loading…' : 'Apply'}
              </Button>
            </div>
          </div>
          {data?.mixed_currency && !currency.trim() ? (
            <div className="mt-4">
              <AdminAlertBanner tone="warning">
                Totals may mix multiple currencies. Set a currency filter for comparable figures.
              </AdminAlertBanner>
            </div>
          ) : null}
        </AdminPanel>

        {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}

        {data ? (
          <>
            <PageSummary>
            <div id="report-tax" className="grid scroll-mt-4 grid-cols-2 gap-3 xl:grid-cols-4">
              {(
                [
                  {
                    label: 'Invoiced (range)',
                    value: formatMoney(data.totals_in_range.invoiced, cur),
                    trend: 'In selected dates',
                    icon: Receipt,
                  },
                  {
                    label: 'Collected',
                    value: formatMoney(data.totals_in_range.collected, cur),
                    trend: 'Payments in range',
                    icon: Banknote,
                  },
                  {
                    label: 'Tax in range',
                    value: formatMoney(data.tax_summary.tax_amount, cur),
                    trend: `${data.tax_summary.invoice_count} invoice(s)`,
                    icon: Percent,
                  },
                  {
                    label: 'Taxable subtotal',
                    value: formatMoney(data.tax_summary.taxable_subtotal, cur),
                    trend: 'Before tax',
                    icon: FileText,
                  },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="ti-kpi-card">
                    <span className="ti-kpi-icon" aria-hidden>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="ti-kpi-value">{m.value}</span>
                    <span className="ti-kpi-label">{m.label}</span>
                    <span className="ti-kpi-trend">{m.trend}</span>
                  </div>
                );
              })}
            </div>
            </PageSummary>

            <AdminPanel
              id="report-revenue"
              kicker="Revenue"
              className="scroll-mt-4"
              bodyClassName="mt-0"
              actions={
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
              }
            >
              <div className="h-[320px] w-full min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} debounce={50}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={themeTokens.chart.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: themeTokens.chart.axis }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: themeTokens.chart.axis }} tickFormatter={(v) => String(v)} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [formatMoney(Number(value ?? 0), cur), '']}
                      labelStyle={{ fontWeight: 600 }}
                      contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${themeTokens.colors.border}`,
                        background: themeTokens.colors.surface,
                        boxShadow: themeTokens.shadows.softMd,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="invoiced" name="Invoiced" fill={themeTokens.chart.expected} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" name="Collected" fill={themeTokens.chart.collected} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminPanel
                id="report-clients"
                kicker="Top clients"
                description="By invoiced total in the selected range (excl. draft & cancelled)."
                className="scroll-mt-4"
                bodyClassName="mt-0"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">
                        <th className="border-b border-[var(--tl-line)] py-2.5 pr-2">Client</th>
                        <th className="border-b border-[var(--tl-line)] py-2.5 text-right">Invoiced</th>
                        <th className="border-b border-[var(--tl-line)] py-2.5 text-right">Paid on inv.</th>
                        <th className="border-b border-[var(--tl-line)] py-2.5 text-right">#</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_clients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 ti-caption text-[var(--tl-ink-3)]">
                            No data in this range.
                          </td>
                        </tr>
                      ) : (
                        data.top_clients.map((c) => (
                          <tr key={c.client_id}>
                            <td className="border-b border-[var(--tl-line)] py-2.5 pr-2 font-medium text-[var(--tl-ink)]">{c.client_name}</td>
                            <td className="border-b border-[var(--tl-line)] py-2.5 text-right tabular-nums">{formatMoney(c.invoiced, cur)}</td>
                            <td className="border-b border-[var(--tl-line)] py-2.5 text-right tabular-nums">
                              {formatMoney(c.paid_on_invoices, cur)}
                            </td>
                            <td className="border-b border-[var(--tl-line)] py-2.5 text-right tabular-nums">{c.invoice_count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </AdminPanel>

              <AdminPanel
                id="report-outstanding"
                kicker="Outstanding invoices"
                description="Open balances (not draft / cancelled), up to 200 rows."
                className="scroll-mt-4"
                bodyClassName="mt-0"
              >
                <div className="max-h-[360px] overflow-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="sticky top-0 bg-white text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">
                        <th className="border-b border-[var(--tl-line)] py-2.5 pr-2">Invoice</th>
                        <th className="border-b border-[var(--tl-line)] py-2.5 pr-2">Client</th>
                        <th className="border-b border-[var(--tl-line)] py-2.5">Due</th>
                        <th className="border-b border-[var(--tl-line)] py-2.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.outstanding.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 ti-caption text-[var(--tl-ink-3)]">
                            Nothing outstanding.
                          </td>
                        </tr>
                      ) : (
                        data.outstanding.map((o) => (
                          <tr key={o.invoice_id}>
                            <td className="border-b border-[var(--tl-line)] py-2.5 pr-2">
                              <Link className="font-semibold text-[var(--tl-ink)] hover:text-[var(--tl-accent)]" href={`${routes.app.invoices}/${o.invoice_id}`}>
                                {o.invoice_number || o.invoice_id.slice(0, 8)}
                              </Link>
                            </td>
                            <td className="border-b border-[var(--tl-line)] py-2.5 pr-2 text-[var(--tl-ink-2)]">{o.client_name ?? '—'}</td>
                            <td className="border-b border-[var(--tl-line)] py-2.5 tabular-nums text-[var(--tl-ink-2)]">{o.due_date}</td>
                            <td className="border-b border-[var(--tl-line)] py-2.5 text-right font-semibold tabular-nums">
                              {formatMoney(o.balance_amount, o.currency)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </AdminPanel>
            </div>
          </>
        ) : null}
      </div>
    </InsightsWorkspace>
  );
}
