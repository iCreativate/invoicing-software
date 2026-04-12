import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import type { CatalogItemType, CatalogListItem } from './types';

function mapRow(r: Record<string, unknown>): CatalogListItem {
  return {
    id: String(r.id),
    itemType: r.item_type as CatalogItemType,
    name: String(r.name ?? ''),
    description: r.description != null ? String(r.description) : null,
    sku: r.sku != null ? String(r.sku) : null,
    unit: r.unit != null ? String(r.unit) : null,
    unitPrice: Number(r.unit_price ?? 0),
    defaultTaxRate: r.default_tax_rate != null ? Number(r.default_tax_rate) : null,
    stockQuantity: r.stock_quantity != null ? Number(r.stock_quantity) : null,
    costPrice: r.cost_price != null ? Number(r.cost_price) : null,
    updatedAt: String(r.updated_at ?? r.created_at ?? ''),
  };
}

export function isCatalogTableMissing(err: unknown): boolean {
  const m = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  return (
    m.includes('relation') ||
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find') ||
    m.includes("couldn't find")
  );
}

export async function fetchCatalogItems(): Promise<{ items: CatalogListItem[]; tableMissing: boolean }> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase
    .from('catalog_items')
    .select(
      'id,item_type,name,description,sku,unit,unit_price,default_tax_rate,stock_quantity,cost_price,created_at,updated_at'
    )
    .eq('owner_id', ownerId)
    .order('name', { ascending: true });

  if (error) {
    if (isCatalogTableMissing(error)) return { items: [], tableMissing: true };
    throw error;
  }

  return { items: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)), tableMissing: false };
}

export type CatalogItemInput = {
  itemType: CatalogItemType;
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  unitPrice: number;
  defaultTaxRate: number | null;
  stockQuantity: number | null;
  costPrice: number | null;
};

function rowPayload(ownerId: string, input: CatalogItemInput) {
  const base = {
    owner_id: ownerId,
    item_type: input.itemType,
    name: input.name.trim(),
    description: input.description?.trim() ? input.description.trim() : null,
    sku: input.sku?.trim() ? input.sku.trim() : null,
    unit: input.unit?.trim() ? input.unit.trim() : null,
    unit_price: input.unitPrice,
    default_tax_rate: input.defaultTaxRate,
    updated_at: new Date().toISOString(),
  };

  if (input.itemType === 'service') {
    return { ...base, stock_quantity: null, cost_price: null };
  }
  if (input.itemType === 'product') {
    return {
      ...base,
      stock_quantity: input.stockQuantity,
      cost_price: input.costPrice,
    };
  }
  return {
    ...base,
    stock_quantity: input.stockQuantity ?? 0,
    cost_price: input.costPrice,
  };
}

export async function createCatalogItem(input: CatalogItemInput): Promise<{ id: string }> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { data, error } = await supabase.from('catalog_items').insert(rowPayload(ownerId, input)).select('id').single();
  if (error) {
    if (isCatalogTableMissing(error)) {
      throw new Error('Catalog table not found. Run apps/web/supabase/catalog-items.sql in the Supabase SQL editor.');
    }
    throw error;
  }
  return { id: String((data as { id: string }).id) };
}

export async function updateCatalogItem(id: string, input: CatalogItemInput): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { error } = await supabase
    .from('catalog_items')
    .update(rowPayload(ownerId, input))
    .eq('id', id)
    .eq('owner_id', ownerId);
  if (error) {
    if (isCatalogTableMissing(error)) {
      throw new Error('Catalog table not found. Run apps/web/supabase/catalog-items.sql in the Supabase SQL editor.');
    }
    throw error;
  }
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { error } = await supabase.from('catalog_items').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) {
    if (isCatalogTableMissing(error)) {
      throw new Error('Catalog table not found. Run apps/web/supabase/catalog-items.sql in the Supabase SQL editor.');
    }
    throw error;
  }
}
