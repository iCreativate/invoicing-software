export type ExpenseRow = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  receiptPath: string | null;
  aiCategory: string | null;
  expenseDate: string;
  /** manual entry vs file import */
  source: 'manual' | 'import';
};

/** Matches AI + reporting categories (see /api/ai/expense-categorize). */
export const EXPENSE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'office', label: 'Office' },
  { value: 'travel', label: 'Travel' },
  { value: 'software', label: 'Software' },
  { value: 'meals', label: 'Meals & entertainment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'professional_services', label: 'Professional services' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'uncategorized', label: 'Uncategorized' },
];

export function formatExpenseCategoryLabel(raw: string): string {
  const v = raw.trim().toLowerCase().replace(/\s+/g, '_');
  const found = EXPENSE_CATEGORY_OPTIONS.find((o) => o.value === v);
  if (found) return found.label;
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
