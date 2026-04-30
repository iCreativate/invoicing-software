import type { PayrollCompensationRow, PayrollRunLineItem } from '@/features/payroll/types';

export function compensationToCsv(rows: PayrollCompensationRow[], workspaceLabel?: string): string {
  const lines: string[] = [];
  if (workspaceLabel) lines.push(`# ${workspaceLabel}`);
  lines.push(['Name', 'Email', 'Base salary', 'Bonus', 'Deductions', 'Net pay', 'Currency'].join(','));
  for (const r of rows) {
    const esc = (s: string) => (s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s);
    lines.push(
      [
        esc(r.name),
        esc(r.email),
        String(r.baseSalary),
        String(r.bonus),
        String(r.deductions),
        String(r.netPay),
        esc(r.currency),
      ].join(',')
    );
  }
  return lines.join('\n');
}

export function runLinesToCsv(
  rows: PayrollRunLineItem[],
  meta: { period: string; payDate: string; total: number; currency: string }
): string {
  const header = ['Employee', 'Base salary', 'Bonus', 'Deductions', 'Net pay', 'Currency'];
  const lines = [header.join(',')];
  for (const r of rows) {
    const esc = (s: string) => (s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s);
    lines.push(
      [
        esc(r.employeeName),
        String(r.baseSalary),
        String(r.bonus),
        String(r.deductions),
        String(r.netPay),
        esc(r.currency),
      ].join(',')
    );
  }
  lines.push('');
  lines.push(`Period,${meta.period}`);
  lines.push(`Pay date,${meta.payDate}`);
  lines.push(`Total (${meta.currency}),${meta.total}`);
  return lines.join('\n');
}

export function openPayrollPrintWindow(title: string, htmlBody: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.open();
  w.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
    th { background: #f4f4f5; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: #666; font-size: 12px; margin-top: 16px; }
    @media print { body { padding: 12px; } }
  </style></head><body>${htmlBody}</body></html>`);
  w.document.close();
  w.focus();
  window.setTimeout(() => {
    w.print();
  }, 250);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCompensationPrintHtml(rows: PayrollCompensationRow[], workspaceLabel: string): string {
  const total = rows.reduce((s, r) => s + r.netPay, 0);
  const cur = rows[0]?.currency ?? 'ZAR';
  const tr = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.email)}</td><td class="num">${r.baseSalary.toFixed(2)}</td><td class="num">${r.bonus.toFixed(2)}</td><td class="num">${r.deductions.toFixed(2)}</td><td class="num"><strong>${r.netPay.toFixed(2)}</strong></td><td>${escapeHtml(r.currency)}</td></tr>`
    )
    .join('');
  return `
    <h1>${escapeHtml(workspaceLabel)} — Payroll summary</h1>
    <p class="muted">Current compensation (not yet run)</p>
    <table>
      <thead><tr><th>Employee</th><th>Email</th><th class="num">Base</th><th class="num">Bonus</th><th class="num">Deductions</th><th class="num">Net pay</th><th>CCY</th></tr></thead>
      <tbody>${tr}</tbody>
      <tfoot><tr><td colspan="5"><strong>Total net</strong></td><td class="num"><strong>${total.toFixed(2)}</strong></td><td>${escapeHtml(cur)}</td></tr></tfoot>
    </table>
  `;
}

export function buildRunLinesPrintHtml(
  rows: PayrollRunLineItem[],
  meta: { period: string; payDate: string; total: number; currency: string },
  workspaceLabel: string
): string {
  const tr = rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.employeeName)}</td><td class="num">${r.baseSalary.toFixed(2)}</td><td class="num">${r.bonus.toFixed(2)}</td><td class="num">${r.deductions.toFixed(2)}</td><td class="num"><strong>${r.netPay.toFixed(2)}</strong></td><td>${escapeHtml(r.currency)}</td></tr>`
    )
    .join('');
  return `
    <h1>${escapeHtml(workspaceLabel)} — Payroll run</h1>
    <p class="muted">Period: ${escapeHtml(meta.period)} · Pay date: ${escapeHtml(meta.payDate)}</p>
    <table>
      <thead><tr><th>Employee</th><th class="num">Base</th><th class="num">Bonus</th><th class="num">Deductions</th><th class="num">Net pay</th><th>CCY</th></tr></thead>
      <tbody>${tr}</tbody>
      <tfoot><tr><td><strong>Total</strong></td><td colspan="3"></td><td class="num"><strong>${meta.total.toFixed(2)}</strong></td><td>${escapeHtml(meta.currency)}</td></tr></tfoot>
    </table>
  `;
}
