import type { InvoiceComposerItem } from './types';
import { calcTotals } from './utils';

/** Line items suitable for DB when saving an in-progress invoice (may include a placeholder row). */
export function workingItemsForDraftSync(items: InvoiceComposerItem[]): InvoiceComposerItem[] {
  const valid = items.filter(
    (it) =>
      it.description.trim().length > 0 &&
      it.quantity > 0 &&
      it.unitPrice >= 0 &&
      it.vatRate >= 0 &&
      it.vatRate <= 100
  );
  if (valid.length > 0) return valid;
  return [
    {
      id: crypto.randomUUID(),
      description: 'Draft — add line items',
      quantity: 1,
      unitPrice: 0,
      vatRate: 15,
    },
  ];
}

export function itemsToPayload(
  rows: InvoiceComposerItem[]
): {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  catalog_item_id?: string;
}[] {
  return rows.map((it) => ({
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    tax_rate: it.vatRate,
    line_total: it.quantity * it.unitPrice + (it.quantity * it.unitPrice * (it.vatRate ?? 0)) / 100,
    ...(it.catalogItemId ? { catalog_item_id: it.catalogItemId } : {}),
  }));
}

export function totalsForDraftSync(items: InvoiceComposerItem[]) {
  return calcTotals(workingItemsForDraftSync(items));
}
