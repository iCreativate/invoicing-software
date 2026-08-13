/**
 * Financial helpers using integer cents to avoid float drift.
 * Persist to DB as numeric/decimal; compute in cents in application code.
 */

export type MoneyCents = number;

export function toCents(amount: number | string): MoneyCents {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromCents(cents: MoneyCents): number {
  return Math.round(cents) / 100;
}

export function roundMoney(amount: number): number {
  return fromCents(toCents(amount));
}

export type TaxMode = 'exclusive' | 'inclusive' | 'exempt';

export type LineCalcInput = {
  quantity: number;
  unitPrice: number;
  /** Percent, e.g. 15 for 15% VAT. Ignored when taxMode is exempt. */
  taxRate?: number;
  taxMode?: TaxMode;
  /** Percent discount on the line net (0–100). */
  discountPercent?: number;
};

export type LineCalcResult = {
  lineNetCents: MoneyCents;
  lineTaxCents: MoneyCents;
  lineTotalCents: MoneyCents;
  lineNet: number;
  lineTax: number;
  lineTotal: number;
};

/**
 * Calculate a single line. Default South African style: VAT exclusive.
 */
export function calcLine(input: LineCalcInput): LineCalcResult {
  const qty = Number(input.quantity);
  const unitCents = toCents(input.unitPrice);
  let netCents = Math.round(qty * unitCents);

  const disc = Math.min(100, Math.max(0, Number(input.discountPercent ?? 0)));
  if (disc > 0) {
    netCents = Math.round(netCents * (1 - disc / 100));
  }

  const mode: TaxMode = input.taxMode ?? 'exclusive';
  const rate = mode === 'exempt' ? 0 : Math.max(0, Number(input.taxRate ?? 0));

  let lineNetCents = netCents;
  let lineTaxCents = 0;
  let lineTotalCents = netCents;

  if (mode === 'exempt' || rate === 0) {
    lineTaxCents = 0;
    lineTotalCents = netCents;
  } else if (mode === 'inclusive') {
    // total includes tax; extract tax portion
    lineTotalCents = netCents;
    lineNetCents = Math.round(netCents / (1 + rate / 100));
    lineTaxCents = lineTotalCents - lineNetCents;
  } else {
    // exclusive
    lineNetCents = netCents;
    lineTaxCents = Math.round(netCents * (rate / 100));
    lineTotalCents = lineNetCents + lineTaxCents;
  }

  return {
    lineNetCents,
    lineTaxCents,
    lineTotalCents,
    lineNet: fromCents(lineNetCents),
    lineTax: fromCents(lineTaxCents),
    lineTotal: fromCents(lineTotalCents),
  };
}

export type InvoiceTotals = {
  subtotalCents: MoneyCents;
  taxCents: MoneyCents;
  totalCents: MoneyCents;
  subtotal: number;
  tax: number;
  total: number;
};

export function calcInvoiceTotalsFromLines(lines: LineCalcInput[]): InvoiceTotals {
  let subtotalCents = 0;
  let taxCents = 0;
  let totalCents = 0;
  for (const line of lines) {
    const r = calcLine(line);
    subtotalCents += r.lineNetCents;
    taxCents += r.lineTaxCents;
    totalCents += r.lineTotalCents;
  }
  return {
    subtotalCents,
    taxCents,
    totalCents,
    subtotal: fromCents(subtotalCents),
    tax: fromCents(taxCents),
    total: fromCents(totalCents),
  };
}

export type BalanceInput = {
  total: number;
  paid: number;
};

export type BalanceResult = {
  totalCents: MoneyCents;
  paidCents: MoneyCents;
  balanceCents: MoneyCents;
  total: number;
  paid: number;
  balance: number;
  /** True when paid exceeds total (invalid; balance clamped to 0). */
  overpaid: boolean;
};

/**
 * Outstanding balance. Never returns negative balance; flags overpayment.
 */
export function calcBalance(input: BalanceInput): BalanceResult {
  const totalCents = Math.max(0, toCents(input.total));
  const paidCents = Math.max(0, toCents(input.paid));
  const overpaid = paidCents > totalCents;
  const balanceCents = Math.max(0, totalCents - paidCents);
  return {
    totalCents,
    paidCents: overpaid ? totalCents : paidCents,
    balanceCents,
    total: fromCents(totalCents),
    paid: fromCents(overpaid ? totalCents : paidCents),
    balance: fromCents(balanceCents),
    overpaid,
  };
}

export function formatZar(amount: number, opts?: { cents?: boolean }): string {
  const n = roundMoney(amount);
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: opts?.cents === false ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Status from totals after payments. */
export function paymentStatusFromBalance(total: number, paid: number): 'unpaid' | 'partial' | 'paid' {
  const { balanceCents, paidCents, totalCents } = calcBalance({ total, paid });
  if (totalCents <= 0) return 'unpaid';
  if (balanceCents <= 0) return 'paid';
  if (paidCents > 0) return 'partial';
  return 'unpaid';
}
