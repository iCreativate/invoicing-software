import type { InvoiceComposerDraft } from './types';

const KEY_PREFIX = 'ti_invoice_draft_v1';

/** `/invoices/new` uses `mode="page"` — drafts persist under this scope. */
export const INVOICE_AUTOSAVE_SCOPE_PAGE = 'page';

export type InvoiceDraftBundle = {
  draft: InvoiceComposerDraft;
  savedAt: number;
  /** When set, this draft is linked to a row in `invoices` (status draft). */
  serverInvoiceId?: string | null;
};

export function draftStorageKey(scope: string) {
  return `${KEY_PREFIX}:${scope}`;
}

function notifyDraftChanged(scope: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ti-invoice-draft-changed', { detail: { scope } }));
}

export function saveDraft(scope: string, draft: InvoiceComposerDraft, serverInvoiceId?: string | null) {
  try {
    const bundle: InvoiceDraftBundle = {
      draft,
      savedAt: Date.now(),
      ...(serverInvoiceId ? { serverInvoiceId } : {}),
    };
    localStorage.setItem(draftStorageKey(scope), JSON.stringify(bundle));
    notifyDraftChanged(scope);
  } catch {
    // ignore
  }
}

export function loadDraft(scope: string): InvoiceDraftBundle | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.draft) return null;
    return {
      draft: parsed.draft as InvoiceComposerDraft,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      serverInvoiceId: parsed.serverInvoiceId != null ? String(parsed.serverInvoiceId) : null,
    };
  } catch {
    return null;
  }
}

export function clearDraft(scope: string) {
  try {
    localStorage.removeItem(draftStorageKey(scope));
    notifyDraftChanged(scope);
  } catch {
    // ignore
  }
}
