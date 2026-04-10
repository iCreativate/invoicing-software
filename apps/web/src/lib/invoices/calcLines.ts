export type LineInput = {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
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
    return {
      description: String(it.description ?? '').trim() || 'Line item',
      quantity: it.quantity,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate ?? 15,
      line_total,
    };
  });
}
