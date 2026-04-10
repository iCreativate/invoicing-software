import type { ReportsPayload } from './types';

export async function fetchReports(params: { from: string; to: string; currency?: string | null }): Promise<ReportsPayload> {
  const sp = new URLSearchParams();
  sp.set('from', params.from.slice(0, 10));
  sp.set('to', params.to.slice(0, 10));
  if (params.currency?.trim()) sp.set('currency', params.currency.trim().toUpperCase());
  const res = await fetch(`/api/reports?${sp}`, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to load reports.');
  }
  return json.data as ReportsPayload;
}

export function reportsToCsv(data: ReportsPayload): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines: string[] = [];
  lines.push(['section', 'key', 'value'].map(esc).join(','));
  lines.push(['meta', 'from', data.range.from].map(esc).join(','));
  lines.push(['meta', 'to', data.range.to].map(esc).join(','));
  lines.push(['meta', 'currency_filter', data.currency_filter ?? ''].map(esc).join(','));
  lines.push(['totals', 'invoiced', data.totals_in_range.invoiced].map(esc).join(','));
  lines.push(['totals', 'collected', data.totals_in_range.collected].map(esc).join(','));
  lines.push(['tax', 'invoice_count', data.tax_summary.invoice_count].map(esc).join(','));
  lines.push(['tax', 'taxable_subtotal', data.tax_summary.taxable_subtotal].map(esc).join(','));
  lines.push(['tax', 'tax_amount', data.tax_summary.tax_amount].map(esc).join(','));
  lines.push('');
  lines.push(['revenue_monthly', 'period', 'invoiced', 'collected'].map(esc).join(','));
  for (const r of data.revenue_monthly) {
    lines.push(['revenue_monthly', r.period, r.invoiced, r.collected].map(esc).join(','));
  }
  lines.push('');
  lines.push(['revenue_yearly', 'year', 'invoiced', 'collected'].map(esc).join(','));
  for (const r of data.revenue_yearly) {
    lines.push(['revenue_yearly', r.year, r.invoiced, r.collected].map(esc).join(','));
  }
  lines.push('');
  lines.push(['top_clients', 'client_name', 'invoiced', 'paid_on_invoices', 'invoice_count'].map(esc).join(','));
  for (const c of data.top_clients) {
    lines.push(['top_clients', c.client_name, c.invoiced, c.paid_on_invoices, c.invoice_count].map(esc).join(','));
  }
  lines.push('');
  lines.push(
    ['outstanding', 'invoice_number', 'client', 'due_date', 'balance', 'currency', 'status'].map(esc).join(',')
  );
  for (const o of data.outstanding) {
    lines.push(
      [
        'outstanding',
        o.invoice_number,
        o.client_name ?? '',
        o.due_date,
        o.balance_amount,
        o.currency,
        o.status,
      ].map(esc).join(',')
    );
  }
  return lines.join('\n');
}

export function openReportPrintDialog(data: ReportsPayload, title: string) {
  const curRaw = data.currency_filter || data.primary_currency_hint || 'ZAR';
  const cur = /^[A-Z]{3}$/.test(curRaw) ? curRaw : 'ZAR';
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${cur} ${n.toFixed(2)}`;
    }
  };
  const monthlyRows = data.revenue_monthly
    .map(
      (r) =>
        `<tr><td>${r.period}</td><td style="text-align:right">${fmt(r.invoiced)}</td><td style="text-align:right">${fmt(r.collected)}</td></tr>`
    )
    .join('');
  const topRows = data.top_clients
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.client_name)}</td><td style="text-align:right">${fmt(c.invoiced)}</td><td style="text-align:right">${c.invoice_count}</td></tr>`
    )
    .join('');
  const outRows = data.outstanding
    .slice(0, 50)
    .map(
      (o) =>
        `<tr><td>${escapeHtml(o.invoice_number)}</td><td>${escapeHtml(o.client_name ?? '—')}</td><td>${o.due_date}</td><td style="text-align:right">${fmt(o.balance_amount)}</td></tr>`
    )
    .join('');
  const html = `
    <h1>${escapeHtml(title)}</h1>
    <p>Period: ${data.range.from} → ${data.range.to}${data.currency_filter ? ` · Currency: ${escapeHtml(data.currency_filter)}` : ''}</p>
    <h2>Summary</h2>
    <table><tr><th>Metric</th><th style="text-align:right">Amount</th></tr>
    <tr><td>Invoiced (in range)</td><td style="text-align:right">${fmt(data.totals_in_range.invoiced)}</td></tr>
    <tr><td>Collected (payments in range)</td><td style="text-align:right">${fmt(data.totals_in_range.collected)}</td></tr>
    <tr><td>Tax (invoices excl. draft/cancelled)</td><td style="text-align:right">${fmt(data.tax_summary.tax_amount)}</td></tr>
    </table>
    <h2>Monthly revenue</h2>
    <table><tr><th>Month</th><th style="text-align:right">Invoiced</th><th style="text-align:right">Collected</th></tr>${monthlyRows}</table>
    <h2>Top clients</h2>
    <table><tr><th>Client</th><th style="text-align:right">Invoiced</th><th style="text-align:right">Invoices</th></tr>${topRows}</table>
    <h2>Outstanding (sample)</h2>
    <table><tr><th>Invoice</th><th>Client</th><th>Due</th><th style="text-align:right">Balance</th></tr>${outRows}</table>
  `;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;padding:24px;color:#111;font-size:12px}
    table{border-collapse:collapse;width:100%;margin-bottom:20px}
    th,td{border:1px solid #ccc;padding:6px 8px}
    th{background:#f4f4f5;text-align:left}
    h1{font-size:18px} h2{font-size:14px;margin-top:16px}
    @media print{body{padding:12px}}
  </style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  requestAnimationFrame(() => w.print());
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
