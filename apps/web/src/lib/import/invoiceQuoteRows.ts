import { normalizeHeaderKey } from './tabular';
import type { TabularParseResult } from './tabular';

export type InvoiceLineImport = {
  invoiceNumber: string | null;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type QuoteLineImport = {
  quoteNumber: string | null;
  clientEmail: string;
  issueDate: string;
  validUntil: string;
  currency: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
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

function num(s: string, fallback: number): number {
  const n = Number(String(s).replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export function groupInvoiceLines(tab: TabularParseResult): {
  groups: Map<
    string,
    { meta: Omit<InvoiceLineImport, 'description' | 'quantity' | 'unitPrice' | 'taxRate'>; lines: Omit<InvoiceLineImport, 'invoiceNumber' | 'clientEmail' | 'issueDate' | 'dueDate' | 'currency'>[] }
  >;
  errors: string[];
} {
  const errors: string[] = [];
  const groups = new Map<
    string,
    {
      meta: Omit<InvoiceLineImport, 'description' | 'quantity' | 'unitPrice' | 'taxRate'>;
      lines: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
    }
  >();

  tab.rows.forEach((raw, idx) => {
    const r = normalizeRow(raw);
    const invoiceNumber = pick(r, 'invoice_number', 'invoice_no', 'invoice', 'number', 'inv') || null;
    const clientEmail = pick(r, 'client_email', 'email', 'customer_email', 'bill_to_email');
    const issueDate = pick(r, 'issue_date', 'date', 'invoice_date');
    const dueDate = pick(r, 'due_date', 'payment_due');
    const currency = (pick(r, 'currency', 'curr') || 'ZAR').toUpperCase().slice(0, 8);
    const description = pick(r, 'description', 'line_description', 'item', 'details');
    const quantity = num(pick(r, 'quantity', 'qty', 'units'), 1);
    const unitPrice = num(pick(r, 'unit_price', 'price', 'rate', 'amount'), 0);
    const taxRate = num(pick(r, 'tax_rate', 'vat', 'vat_rate'), 15);

    if (!clientEmail) {
      errors.push(`Row ${idx + 2}: client_email is required.`);
      return;
    }
    if (!issueDate || !dueDate) {
      errors.push(`Row ${idx + 2}: issue_date and due_date are required.`);
      return;
    }
    if (!description) {
      errors.push(`Row ${idx + 2}: description is required.`);
      return;
    }

    const key = [invoiceNumber ?? '', clientEmail.toLowerCase(), issueDate.slice(0, 10), dueDate.slice(0, 10), currency].join('|');

    if (!groups.has(key)) {
      groups.set(key, {
        meta: {
          invoiceNumber,
          clientEmail: clientEmail.toLowerCase(),
          issueDate: issueDate.slice(0, 10),
          dueDate: dueDate.slice(0, 10),
          currency,
        },
        lines: [],
      });
    }
    groups.get(key)!.lines.push({ description, quantity, unitPrice, taxRate });
  });

  return { groups, errors };
}

export function groupQuoteLines(tab: TabularParseResult): {
  groups: Map<
    string,
    {
      meta: Omit<QuoteLineImport, 'description' | 'quantity' | 'unitPrice' | 'taxRate'>;
      lines: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
    }
  >;
  errors: string[];
} {
  const errors: string[] = [];
  const groups = new Map<
    string,
    {
      meta: Omit<QuoteLineImport, 'description' | 'quantity' | 'unitPrice' | 'taxRate'>;
      lines: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
    }
  >();

  tab.rows.forEach((raw, idx) => {
    const r = normalizeRow(raw);
    const quoteNumber = pick(r, 'quote_number', 'quote_no', 'quote', 'number') || null;
    const clientEmail = pick(r, 'client_email', 'email', 'customer_email');
    const issueDate = pick(r, 'issue_date', 'date', 'quote_date');
    const validUntil = pick(r, 'valid_until', 'expiry', 'expires', 'valid_to');
    const currency = (pick(r, 'currency', 'curr') || 'ZAR').toUpperCase().slice(0, 8);
    const description = pick(r, 'description', 'line_description', 'item');
    const quantity = num(pick(r, 'quantity', 'qty'), 1);
    const unitPrice = num(pick(r, 'unit_price', 'price', 'rate'), 0);
    const taxRate = num(pick(r, 'tax_rate', 'vat', 'vat_rate'), 15);

    if (!clientEmail) {
      errors.push(`Row ${idx + 2}: client_email is required.`);
      return;
    }
    if (!issueDate || !validUntil) {
      errors.push(`Row ${idx + 2}: issue_date and valid_until are required.`);
      return;
    }
    if (!description) {
      errors.push(`Row ${idx + 2}: description is required.`);
      return;
    }

    const key = [quoteNumber ?? '', clientEmail.toLowerCase(), issueDate.slice(0, 10), validUntil.slice(0, 10), currency].join('|');

    if (!groups.has(key)) {
      groups.set(key, {
        meta: {
          quoteNumber,
          clientEmail: clientEmail.toLowerCase(),
          issueDate: issueDate.slice(0, 10),
          validUntil: validUntil.slice(0, 10),
          currency,
        },
        lines: [],
      });
    }
    groups.get(key)!.lines.push({ description, quantity, unitPrice, taxRate });
  });

  return { groups, errors };
}
