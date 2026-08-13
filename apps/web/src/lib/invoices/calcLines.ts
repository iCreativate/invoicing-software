import { calcInvoiceTotalsFromLines, roundMoney } from '@/lib/money';

export type LineInput = {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  /** When set, sent invoices deduct this quantity from inventory catalog items. */
  catalog_item_id?: string | null;
  discount_percent?: number;
  tax_mode?: 'exclusive' | 'inclusive' | 'exempt';
};

export function calcInvoiceTotals(items: LineInput[]) {
  const totals = calcInvoiceTotalsFromLines(
    items.map((it) => ({
      quantity: it.quantity,
      unitPrice: it.unit_price,
      taxRate: it.tax_rate,
      taxMode: it.tax_mode ?? 'exclusive',
      discountPercent: it.discount_percent,
    }))
  );
  return {
    subtotal_amount: totals.subtotal,
    tax_amount: totals.tax,
    total_amount: totals.total,
  };
}

export function linesToPayload(items: LineInput[]) {
  return items.map((it) => {
    const line = calcInvoiceTotalsFromLines([
      {
        quantity: it.quantity,
        unitPrice: it.unit_price,
        taxRate: it.tax_rate,
        taxMode: it.tax_mode ?? 'exclusive',
        discountPercent: it.discount_percent,
      },
    ]);
    const cid = it.catalog_item_id != null && String(it.catalog_item_id).trim() ? String(it.catalog_item_id).trim() : null;
    return {
      description: String(it.description ?? '').trim() || 'Line item',
      quantity: it.quantity,
      unit_price: roundMoney(it.unit_price),
      tax_rate: it.tax_rate ?? 15,
      line_total: line.total,
      ...(cid ? { catalog_item_id: cid } : {}),
    };
  });
}
