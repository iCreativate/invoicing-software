import { normalizeHeaderKey } from './tabular';
import type { TabularParseResult } from './tabular';

export type ParsedExpenseRow = {
  expenseDate: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
};

function normalizeRow(row: Record<string, string>): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    o[normalizeHeaderKey(k)] = v;
  }
  return o;
}

function pick(r: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const nk = normalizeHeaderKey(k);
    if (r[nk] !== undefined && String(r[nk]).trim() !== '') return String(r[nk]).trim();
  }
  return '';
}

/** Accept ISO, locale dates, and common bank export formats (DD/MM/YYYY). */
function normalizeExpenseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (iso) return iso[1];
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(s);
  if (dmy) {
    let day = parseInt(dmy[1], 10);
    let month = parseInt(dmy[2], 10);
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    if (month > 12 && day <= 12) {
      const t = month;
      month = day;
      day = t;
    } else if (day > 12 && month <= 12) {
      /* already day / month */
    } else if (day <= 12 && month <= 12) {
      // Ambiguous: assume DD/MM (ZA / EU)
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
    return dt.toISOString().slice(0, 10);
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return null;
}

function parseAmount(s: string): number | null {
  let t = s.trim().replace(/\s/g, '');
  const hasComma = t.includes(',');
  const hasDot = t.includes('.');
  if (hasComma && hasDot) {
    const lastComma = t.lastIndexOf(',');
    const lastDot = t.lastIndexOf('.');
    if (lastComma > lastDot) {
      t = t.replace(/\./g, '').replace(',', '.');
    } else {
      t = t.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    const parts = t.split(',');
    if (parts.length === 2 && parts[1].length <= 2 && /^\d+$/.test(parts[1])) {
      t = `${parts[0].replace(/\./g, '')}.${parts[1]}`;
    } else {
      t = t.replace(/,/g, '');
    }
  } else {
    t = t.replace(/[^\d.-]/g, '');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function parseExpenseRows(tab: TabularParseResult): { ok: ParsedExpenseRow[]; errors: string[] } {
  const ok: ParsedExpenseRow[] = [];
  const errors: string[] = [];
  tab.rows.forEach((raw, idx) => {
    const r = normalizeRow(raw);
    const expenseDateRaw =
      pick(
        r,
        'expense_date',
        'date',
        'transaction_date',
        'posted_date',
        'txn_date',
        'trans_date',
        'booking_date',
        'value_date',
        'when'
      ) || pick(r, 'day');
    const expenseDate = expenseDateRaw ? normalizeExpenseDate(expenseDateRaw) : null;
    const amountStr = pick(
      r,
      'amount',
      'total',
      'value',
      'debit',
      'credit',
      'amt',
      'cost',
      'price',
      'sum',
      'subtotal',
      'grand_total',
      'payment'
    );
    const currency = (pick(r, 'currency', 'curr') || 'ZAR').toUpperCase().slice(0, 8);
    const category = (pick(r, 'category', 'type', 'class') || 'uncategorized').toLowerCase().replace(/\s+/g, '_');
    const description = pick(r, 'description', 'desc', 'memo', 'details', 'narration', 'payee', 'merchant') || null;

    const amount = parseAmount(amountStr);
    if (!amountStr) {
      errors.push(`Row ${idx + 2}: missing amount (column amount, total, debit, etc.).`);
      return;
    }
    if (!expenseDateRaw) {
      errors.push(`Row ${idx + 2}: missing date (column expense_date, date, transaction_date, etc.).`);
      return;
    }
    if (!expenseDate) {
      errors.push(`Row ${idx + 2}: could not parse date "${expenseDateRaw}".`);
      return;
    }
    if (amount == null || amount <= 0) {
      errors.push(`Row ${idx + 2}: invalid amount "${amountStr}".`);
      return;
    }
    ok.push({
      expenseDate,
      amount,
      currency,
      category,
      description,
    });
  });
  return { ok, errors };
}
