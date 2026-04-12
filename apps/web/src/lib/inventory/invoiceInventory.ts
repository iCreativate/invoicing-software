import type { SupabaseClient } from '@supabase/supabase-js';
import { isCatalogTableMissing } from '@/features/catalog/api';

/** When an invoice is sent, subtract invoiced quantities from inventory catalog items (item_type = inventory). */
export async function maybeDeductInventoryForSentInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
  workspaceOwnerId: string
): Promise<void> {
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('id,owner_id,inventory_deducted_at')
    .eq('id', invoiceId)
    .eq('owner_id', workspaceOwnerId)
    .maybeSingle();

  if (invErr) throw invErr;
  if (!inv || (inv as { inventory_deducted_at?: string | null }).inventory_deducted_at) return;

  const { data: lines, error: linesErr } = await supabase
    .from('invoice_items')
    .select('catalog_item_id,quantity')
    .eq('invoice_id', invoiceId)
    .not('catalog_item_id', 'is', null);

  if (linesErr) {
    if (isCatalogTableMissing(linesErr)) return;
    throw linesErr;
  }

  const rows = (lines ?? []) as { catalog_item_id: string | null; quantity: number | string }[];

  if (rows.length === 0) {
    await supabase
      .from('invoices')
      .update({ inventory_deducted_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('owner_id', workspaceOwnerId);
    return;
  }

  const { data: claimed, error: claimErr } = await supabase
    .from('invoices')
    .update({ inventory_deducted_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('owner_id', workspaceOwnerId)
    .is('inventory_deducted_at', null)
    .select('id')
    .maybeSingle();

  if (claimErr) throw claimErr;
  if (!claimed) return;

  try {
    for (const row of rows) {
      const cid = row.catalog_item_id;
      const qty = Number(row.quantity ?? 0);
      if (!cid || !Number.isFinite(qty) || qty <= 0) continue;

      const { data: cat, error: cErr } = await supabase
        .from('catalog_items')
        .select('id,item_type,stock_quantity,owner_id')
        .eq('id', cid)
        .maybeSingle();

      if (cErr) {
        if (isCatalogTableMissing(cErr)) continue;
        throw cErr;
      }
      if (!cat || String((cat as { owner_id?: string }).owner_id) !== workspaceOwnerId) continue;
      if (String((cat as { item_type?: string }).item_type) !== 'inventory') continue;

      const cur = Number((cat as { stock_quantity?: number | null }).stock_quantity ?? 0);
      const next = cur - qty;

      const { error: uErr } = await supabase
        .from('catalog_items')
        .update({ stock_quantity: next, updated_at: new Date().toISOString() })
        .eq('id', cid)
        .eq('owner_id', workspaceOwnerId)
        .eq('item_type', 'inventory');

      if (uErr) throw uErr;
    }
  } catch (e) {
    await supabase.from('invoices').update({ inventory_deducted_at: null }).eq('id', invoiceId).eq('owner_id', workspaceOwnerId);
    throw e;
  }
}

/** Add stock back when a sent invoice is deleted (or voided) after deduction ran. */
export async function restoreInventoryForSentInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
  workspaceOwnerId: string
): Promise<void> {
  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('inventory_deducted_at')
    .eq('id', invoiceId)
    .eq('owner_id', workspaceOwnerId)
    .maybeSingle();

  if (invErr) throw invErr;
  if (!inv || !(inv as { inventory_deducted_at?: string | null }).inventory_deducted_at) return;

  const { data: lines, error: linesErr } = await supabase
    .from('invoice_items')
    .select('catalog_item_id,quantity')
    .eq('invoice_id', invoiceId)
    .not('catalog_item_id', 'is', null);

  if (linesErr) {
    if (isCatalogTableMissing(linesErr)) return;
    throw linesErr;
  }

  for (const row of (lines ?? []) as { catalog_item_id: string | null; quantity: number | string }[]) {
    const cid = row.catalog_item_id;
    const qty = Number(row.quantity ?? 0);
    if (!cid || !Number.isFinite(qty) || qty <= 0) continue;

    const { data: cat, error: cErr } = await supabase
      .from('catalog_items')
      .select('id,item_type,stock_quantity,owner_id')
      .eq('id', cid)
      .maybeSingle();

    if (cErr) {
      if (isCatalogTableMissing(cErr)) continue;
      throw cErr;
    }
    if (!cat || String((cat as { owner_id?: string }).owner_id) !== workspaceOwnerId) continue;
    if (String((cat as { item_type?: string }).item_type) !== 'inventory') continue;

    const cur = Number((cat as { stock_quantity?: number | null }).stock_quantity ?? 0);

    const { error: uErr } = await supabase
      .from('catalog_items')
      .update({ stock_quantity: cur + qty, updated_at: new Date().toISOString() })
      .eq('id', cid)
      .eq('owner_id', workspaceOwnerId)
      .eq('item_type', 'inventory');

    if (uErr) throw uErr;
  }
}
