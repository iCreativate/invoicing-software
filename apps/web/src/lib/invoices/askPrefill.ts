import type { LocalInvoiceDraft } from '@/lib/ai/localInvoiceDraft';

export const ASK_INVOICE_PREFILL_KEY = 'ti-ask-invoice-prefill';

export function storeAskInvoicePrefill(draft: LocalInvoiceDraft) {
  try {
    sessionStorage.setItem(ASK_INVOICE_PREFILL_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

export function consumeAskInvoicePrefill(): LocalInvoiceDraft | null {
  try {
    const raw = sessionStorage.getItem(ASK_INVOICE_PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ASK_INVOICE_PREFILL_KEY);
    const parsed = JSON.parse(raw) as LocalInvoiceDraft;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}
