export type LineInput = {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  /** When set, sent invoices deduct this quantity from inventory catalog items. */
  catalog_item_id?: string | null;
};

export function calcInvoiceTotals(items: LineInput[]) {
  let subtotal = 0;
  let tax = 0;
  for (const it of items) {
    const lineNet = it.quantity * it.unit_price;
    subtotal += lineNet;
    tax += (lineNet * (it.tax_rate ?? 0)) / 100;
  }
  const total = subtotal + tax;
  return {
    subtotal_amount: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(tax * 100) / 100,
    total_amount: Math.round(total * 100) / 100,
  };
}

export function linesToPayload(items: LineInput[]) {
  return items.map((it) => {
    const lineNet = it.quantity * it.unit_price;
    const lineVat = (lineNet * (it.tax_rate ?? 0)) / 100;
    const line_total = Math.round((lineNet + lineVat) * 100) / 100;
    const cid = it.catalog_item_id != null && String(it.catalog_item_id).trim() ? String(it.catalog_item_id).trim() : null;
    return {
      description: String(it.description ?? '').trim() || 'Line item',
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate ?? 15,
      line_total,
      ...(cid ? { catalog_item_id: cid } : {}),
    };
  });
}
