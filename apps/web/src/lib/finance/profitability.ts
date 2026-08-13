import { calcBalance, roundMoney } from '@/lib/money';

/**
 * Lightweight profitability estimate — not accounting or tax advice.
 */
export type ProfitabilityEstimate = {
  revenue: number;
  expenses: number;
  estimatedProfit: number;
  marginPercent: number | null;
  disclaimer: string;
};

export function estimateProfitability(revenue: number, expenses: number): ProfitabilityEstimate {
  const r = roundMoney(Math.max(0, revenue));
  const e = roundMoney(Math.max(0, expenses));
  const estimatedProfit = roundMoney(r - e);
  const marginPercent = r > 0 ? roundMoney((estimatedProfit / r) * 100) : null;
  return {
    revenue: r,
    expenses: e,
    estimatedProfit,
    marginPercent,
    disclaimer:
      'Estimated profit from recorded invoices and expenses only. Not an accounting, tax, or SARS result.',
  };
}

export function paymentProgress(total: number, paid: number) {
  const bal = calcBalance({ total, paid });
  const pct = bal.totalCents > 0 ? Math.min(100, Math.round((bal.paidCents / bal.totalCents) * 100)) : 0;
  return { ...bal, percentPaid: pct };
}
