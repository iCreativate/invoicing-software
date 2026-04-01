import type { InvoiceComposerDraft } from './types';

const KEY_PREFIX = 'ti_invoice_draft_v1';

export function draftStorageKey(scope: string) {
  return `${KEY_PREFIX}:${scope}`;
}

export function saveDraft(scope: string, draft: InvoiceComposerDraft) {
  try {
    localStorage.setItem(draftStorageKey(scope), JSON.stringify({ draft, savedAt: Date.now() }));
  } catch {
    // ignore
  }
}

export function loadDraft(scope: string): { draft: InvoiceComposerDraft; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(scope));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(scope: string) {
  try {
    localStorage.removeItem(draftStorageKey(scope));
  } catch {
    // ignore
  }
}

