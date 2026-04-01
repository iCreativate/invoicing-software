import type { InvoiceComposerItem } from './types';

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function makeEmptyItem(vatRate = 15): InvoiceComposerItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate,
  };
}

export function calcTotals(items: InvoiceComposerItem[]) {
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const vat = items.reduce((sum, it) => sum + it.quantity * it.unitPrice * (it.vatRate || 0) / 100, 0);
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

