import type { InvoiceComposerDraft } from '@/components/invoice/composer/types';

/** Map API invoice row (with nested items) to InvoicePreview draft shape. */
export function invoiceApiToPreviewDraft(inv: {
  invoice_number?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  currency?: string | null;
  template_id?: string | null;
  notes?: string | null;
  items?: Array<{
    id?: string;
    description?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    tax_rate?: number | null;
  }>;
}): InvoiceComposerDraft {
  const items = (inv.items ?? []).map((it) => ({
    id: String(it.id ?? crypto.randomUUID()),
    description: String(it.description ?? ''),
    quantity: Number(it.quantity ?? 1),
    unitPrice: Number(it.unit_price ?? 0),
    vatRate: Number(it.tax_rate ?? 15),
  }));
  return {
    invoiceNumber: inv.invoice_number ? String(inv.invoice_number) : null,
    clientId: '',
    issueDate: String(inv.issue_date ?? ''),
    dueDate: String(inv.due_date ?? ''),
    currency: String(inv.currency ?? 'ZAR'),
    template: (String(inv.template_id ?? 'modern') as InvoiceComposerDraft['template']) || 'modern',
    items: items.length ? items : [],
    notes: inv.notes ? String(inv.notes) : undefined,
  };
}
