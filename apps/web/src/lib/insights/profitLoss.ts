import type { ExpenseRow } from '@/features/expenses/types';

/** Direct costs for a simplified P&L. Remaining logged spend is operating. */
const COST_OF_SALES_CATEGORIES = new Set(['payroll', 'equipment']);

export function isCostOfSalesCategory(category: string) {
  return COST_OF_SALES_CATEGORIES.has(category.trim().toLowerCase().replace(/\s+/g, '_'));
}

export function splitExpenses(items: Pick<ExpenseRow, 'amount' | 'category'>[]) {
  let costOfSales = 0;
  let operating = 0;
  for (const row of items) {
    const amt = Number(row.amount ?? 0);
    if (isCostOfSalesCategory(row.category)) costOfSales += amt;
    else operating += amt;
  }
  return { costOfSales, operating, total: costOfSales + operating };
}

export function expensesInRange(
  items: ExpenseRow[],
  from: string,
  toExclusive: string
) {
  return items.filter((x) => {
    const d = x.expenseDate.slice(0, 10);
    return d >= from && d < toExclusive;
  });
}

export function utcMonthBounds(offsetMonths: number) {
  const now = new Date();
  const d0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
  const d1 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths + 1, 1));
  return {
    from: d0.toISOString().slice(0, 10),
    toExclusive: d1.toISOString().slice(0, 10),
    label: d0.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

export function utcYtdBounds() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10);
  const toExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10);
  return { from, toExclusive, label: `${now.getUTCFullYear()} year to date` };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
