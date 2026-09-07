import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { INVOICE_TEMPLATE_PRESETS } from '@/lib/invoices/templates';
import type { InvoiceComposerDraft } from './types';
import type { InvoiceDraftBundle } from './autosave';
import { clearDraft, loadDraft, saveDraft } from './autosave';
import { makeEmptyItem } from './utils';

const VALID_TEMPLATES = new Set(INVOICE_TEMPLATE_PRESETS.map((t) => t.id));

const DRAFT_SELECT = `
  id,
  client_id,
  invoice_number,
  status,
  issue_date,
  due_date,
  currency,
  template_id,
  notes,
  public_share_id,
  updated_at,
  items:invoice_items(id,description,quantity,unit_price,tax_rate,catalog_item_id)
`;

function coerceTemplate(raw: unknown): InvoiceComposerDraft['template'] {
  const id = String(raw ?? 'modern');
  return (VALID_TEMPLATES.has(id as InvoiceComposerDraft['template']) ? id : 'modern') as InvoiceComposerDraft['template'];
}

export function mapInvoiceRowToComposerDraft(inv: Record<string, unknown>): InvoiceComposerDraft & { publicShareId?: string } {
  const rawItems = Array.isArray(inv.items) ? inv.items : [];
  const items =
    rawItems.length > 0
      ? rawItems.map((it: Record<string, unknown>) => ({
          id: String(it.id ?? crypto.randomUUID()),
          description: String(it.description ?? ''),
          quantity: Number(it.quantity ?? 1),
          unitPrice: Number(it.unit_price ?? 0),
          vatRate: Number(it.tax_rate ?? 15),
          ...(it.catalog_item_id ? { catalogItemId: String(it.catalog_item_id) } : {}),
        }))
      : [makeEmptyItem(15)];

  return {
    clientId: String(inv.client_id ?? ''),
    invoiceNumber: inv.invoice_number ? String(inv.invoice_number) : null,
    issueDate: String(inv.issue_date ?? ''),
    dueDate: String(inv.due_date ?? ''),
    currency: String(inv.currency ?? 'ZAR'),
    template: coerceTemplate(inv.template_id),
    items,
    notes: inv.notes ? String(inv.notes) : undefined,
    ...(inv.public_share_id ? { publicShareId: String(inv.public_share_id) } : {}),
  };
}

function rowToBundle(inv: Record<string, unknown>): InvoiceDraftBundle {
  const updatedAt = inv.updated_at ? Date.parse(String(inv.updated_at)) : Date.now();
  return {
    draft: mapInvoiceRowToComposerDraft(inv),
    savedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    serverInvoiceId: String(inv.id),
  };
}

/** Load a specific draft invoice or the most recently updated draft row from Supabase. */
export async function fetchServerDraftBundle(preferredId?: string | null): Promise<InvoiceDraftBundle | null> {
  if (isDemoUiActive()) return null;

  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  if (preferredId) {
    const { data, error } = await supabase
      .from('invoices')
      .select(DRAFT_SELECT)
      .eq('id', preferredId)
      .eq('owner_id', ownerId)
      .eq('status', 'draft')
      .maybeSingle();
    if (error || !data) return null;
    return rowToBundle(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from('invoices')
    .select(DRAFT_SELECT)
    .eq('owner_id', ownerId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToBundle(data as Record<string, unknown>);
}

/** Prefer the newest draft between local storage and Supabase; sync local copy when server wins. */
export async function resolveDraftBundle(scope: string, local: InvoiceDraftBundle | null): Promise<InvoiceDraftBundle | null> {
  let server: InvoiceDraftBundle | null = null;
  try {
    server = await fetchServerDraftBundle(local?.serverInvoiceId);
  } catch {
    return local;
  }

  if (!local && !server) return null;
  if (!server) return local;
  if (!local) {
    saveDraft(scope, server.draft, server.serverInvoiceId);
    return server;
  }

  const localHasClient = Boolean(local.draft.clientId?.trim());
  const serverHasClient = Boolean(server.draft.clientId?.trim());

  if (!localHasClient && serverHasClient) {
    saveDraft(scope, server.draft, server.serverInvoiceId);
    return server;
  }

  if (localHasClient && !serverHasClient) return local;

  const localTime = local.savedAt ?? 0;
  const serverTime = server.savedAt ?? 0;
  if (serverTime > localTime + 1000) {
    saveDraft(scope, server.draft, server.serverInvoiceId);
    return server;
  }

  if (server.serverInvoiceId && !local.serverInvoiceId) {
    saveDraft(scope, local.draft, server.serverInvoiceId);
    return { ...local, serverInvoiceId: server.serverInvoiceId };
  }

  return local;
}

export async function loadPersistedDraft(scope: string): Promise<InvoiceDraftBundle | null> {
  const local = loadDraft(scope);
  return resolveDraftBundle(scope, local);
}

export async function deleteServerDraft(invoiceId: string): Promise<void> {
  if (isDemoUiActive() || !invoiceId) return;
  await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE', credentials: 'include' });
}

/** Clear local draft and delete linked server draft row when present. */
export async function discardPersistedDraft(scope: string, serverInvoiceId?: string | null) {
  clearDraft(scope);
  if (serverInvoiceId) {
    try {
      await deleteServerDraft(serverInvoiceId);
    } catch {
      // local draft is already cleared; server row may remain until user deletes from list
    }
  }
}
