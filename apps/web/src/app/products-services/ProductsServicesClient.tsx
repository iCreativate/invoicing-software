'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { cn } from '@/lib/utils/cn';
import {
  createCatalogItem,
  deleteCatalogItem,
  fetchCatalogItems,
  updateCatalogItem,
} from '@/features/catalog/api';
import type { CatalogItemType, CatalogListItem } from '@/features/catalog/types';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';

type FilterKey = 'all' | CatalogItemType;

const CURRENCY = 'ZAR';

const TYPE_LABEL: Record<CatalogItemType, string> = {
  service: 'Service',
  product: 'Product',
  inventory: 'Inventory',
};

function typeBadgeVariant(t: CatalogItemType): 'primary' | 'outline' | 'success' {
  if (t === 'service') return 'primary';
  if (t === 'inventory') return 'success';
  return 'outline';
}

function parseOptNumber(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseReqNonNegNumber(s: string, fallback: number): number {
  const n = Number(String(s).trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

type FormState = {
  itemType: CatalogItemType;
  name: string;
  description: string;
  sku: string;
  unit: string;
  unitPrice: string;
  defaultTaxRate: string;
  stockQuantity: string;
  costPrice: string;
};

const emptyForm = (): FormState => ({
  itemType: 'service',
  name: '',
  description: '',
  sku: '',
  unit: '',
  unitPrice: '0',
  defaultTaxRate: '',
  stockQuantity: '',
  costPrice: '',
});

function formFromItem(item: CatalogListItem): FormState {
  return {
    itemType: item.itemType,
    name: item.name,
    description: item.description ?? '',
    sku: item.sku ?? '',
    unit: item.unit ?? '',
    unitPrice: String(item.unitPrice),
    defaultTaxRate: item.defaultTaxRate != null ? String(item.defaultTaxRate) : '',
    stockQuantity:
      item.stockQuantity != null && (item.itemType === 'product' || item.itemType === 'inventory')
        ? String(item.stockQuantity)
        : '',
    costPrice: item.costPrice != null ? String(item.costPrice) : '',
  };
}

export default function ProductsServicesClient() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CatalogListItem[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: list, tableMissing: missing } = await fetchCatalogItems();
      setItems(list);
      setTableMissing(missing);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load catalog.');
      setItems([]);
      setTableMissing(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (filter !== 'all') list = list.filter((i) => i.itemType === filter);
    if (!q) return list;
    return list.filter((i) => {
      const blob = `${i.name} ${i.sku ?? ''} ${i.description ?? ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [items, query, filter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: CatalogListItem) => {
    setEditingId(item.id);
    setForm(formFromItem(item));
    setFormError(null);
    setModalOpen(true);
  };

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const name = form.name.trim();
    if (!name) {
      setFormError('Name is required.');
      return;
    }
    const unitPrice = parseOptNumber(form.unitPrice);
    if (unitPrice == null || unitPrice < 0) {
      setFormError('Enter a valid unit price (0 or more).');
      return;
    }
    const defaultTaxRate = parseOptNumber(form.defaultTaxRate);

    let stockQuantity: number | null = null;
    let costPrice: number | null = parseOptNumber(form.costPrice);

    if (form.itemType === 'service') {
      stockQuantity = null;
      costPrice = null;
    } else if (form.itemType === 'product') {
      stockQuantity = parseOptNumber(form.stockQuantity);
      if (form.stockQuantity.trim() && stockQuantity == null) {
        setFormError('Invalid quantity on hand.');
        return;
      }
    } else {
      stockQuantity = parseReqNonNegNumber(form.stockQuantity, 0);
    }

    const payload = {
      itemType: form.itemType,
      name,
      description: form.description.trim() || undefined,
      sku: form.sku.trim() || undefined,
      unit: form.unit.trim() || undefined,
      unitPrice,
      defaultTaxRate,
      stockQuantity,
      costPrice,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateCatalogItem(editingId, payload);
      } else {
        await createCatalogItem(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this catalog item? This cannot be undone.')) return;
    try {
      await deleteCatalogItem(id);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const filterBtn = (key: FilterKey, label: string) => (
    <Button
      type="button"
      size="sm"
      variant={filter === key ? 'primary' : 'secondary'}
      className="h-9"
      onClick={() => setFilter(key)}
    >
      {label}
    </Button>
  );

  return (
    <AppShell
      title="Products & services"
      actions={
        canMutate ? (
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        ) : (
          <Button asChild variant="primary">
            <Link href={`${routes.app.invoices}/new`}>New invoice</Link>
          </Button>
        )
      }
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {tableMissing ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-semibold">Database table required</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
              Run the SQL in <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs dark:bg-amber-900/50">apps/web/supabase/catalog-items.sql</code> in the
              Supabase SQL editor, then refresh this page.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold">Catalog</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${filtered.length} item(s)`} — services, sellable products, and stock.
              </div>
            </div>
            <div className="w-full max-w-md">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, SKU, description…" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {filterBtn('all', 'All')}
            {filterBtn('service', 'Services')}
            {filterBtn('product', 'Products')}
            {filterBtn('inventory', 'Inventory')}
          </div>

          {!loading && !tableMissing && filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">No items yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {items.length === 0
                  ? 'Add services, products, or inventory rows to reuse on invoices and quotes.'
                  : 'Nothing matches this filter or search.'}
              </p>
              {canMutate && items.length === 0 ? (
                <Button className="mt-4" variant="primary" onClick={openCreate}>
                  Add your first item
                </Button>
              ) : null}
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((row) => (
                  <Card key={row.id} className="border border-border p-4 shadow-none">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground">{row.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant={typeBadgeVariant(row.itemType)}>{TYPE_LABEL[row.itemType]}</Badge>
                          {row.sku ? (
                            <span className="text-xs text-muted-foreground">SKU {row.sku}</span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {formatMoney(row.unitPrice, CURRENCY)}
                          {row.unit ? ` / ${row.unit}` : ''}
                          {row.itemType !== 'service' && row.stockQuantity != null ? (
                            <span className="ml-2">· On hand {row.stockQuantity}</span>
                          ) : null}
                        </div>
                      </div>
                      {canMutate ? (
                        <div className="flex shrink-0 gap-1">
                          <Button type="button" size="sm" variant="secondary" className="h-9 px-2" onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            className="h-9 px-2"
                            onClick={() => void onDelete(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-muted-foreground">
                      <th className="border-b border-border px-3 py-2">Name</th>
                      <th className="border-b border-border px-3 py-2">Type</th>
                      <th className="border-b border-border px-3 py-2">SKU</th>
                      <th className="border-b border-border px-3 py-2 text-right">Price</th>
                      <th className="border-b border-border px-3 py-2 text-right">Stock / cost</th>
                      <th className="border-b border-border px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id} className="text-sm">
                        <td className="border-b border-border px-3 py-3">
                          <div className="font-medium text-foreground">{row.name}</div>
                          {row.description ? (
                            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.description}</div>
                          ) : null}
                        </td>
                        <td className="border-b border-border px-3 py-3">
                          <Badge variant={typeBadgeVariant(row.itemType)}>{TYPE_LABEL[row.itemType]}</Badge>
                        </td>
                        <td className="border-b border-border px-3 py-3 text-muted-foreground">{row.sku ?? '—'}</td>
                        <td className="border-b border-border px-3 py-3 text-right tabular-nums">
                          {formatMoney(row.unitPrice, CURRENCY)}
                          {row.unit ? <span className="text-muted-foreground"> / {row.unit}</span> : null}
                        </td>
                        <td className="border-b border-border px-3 py-3 text-right text-muted-foreground">
                          {row.itemType === 'service' ? (
                            '—'
                          ) : (
                            <>
                              {row.stockQuantity != null ? `${row.stockQuantity} on hand` : '—'}
                              {row.costPrice != null ? (
                                <span className="block text-xs">Cost {formatMoney(row.costPrice, CURRENCY)}</span>
                              ) : null}
                            </>
                          )}
                        </td>
                        <td className="border-b border-border px-3 py-3 text-right">
                          {canMutate ? (
                            <div className="inline-flex gap-2">
                              <Button type="button" size="sm" variant="secondary" className="h-9" onClick={() => openEdit(row)}>
                                Edit
                              </Button>
                              <Button type="button" size="sm" variant="danger" className="h-9" onClick={() => void onDelete(row.id)}>
                                Delete
                              </Button>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </Card>

        <div className="rounded-xl border border-border bg-card px-4 py-4 sm:px-6">
          <p className="text-sm text-muted-foreground">
            On invoices, choose an inventory row under line items to link the line; when you send the invoice, on-hand
            quantity decreases by the line quantity. Services and products are for pricing reference unless linked the
            same way later.
          </p>
        </div>
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle>{editingId ? 'Edit item' : 'Add item'}</ModalTitle>
            <ModalDescription>
              Services bill time or fixed fees. Products are sellable lines; inventory tracks quantity on hand.
            </ModalDescription>
          </ModalHeader>
          <form onSubmit={onSubmitForm} className="mt-2 space-y-4">
            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="itemType">
                Type
              </label>
              <select
                id="itemType"
                className={cn(
                  'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-[var(--shadow-sm)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring/40'
                )}
                value={form.itemType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    itemType: e.target.value as CatalogItemType,
                    stockQuantity: e.target.value === 'service' ? '' : f.stockQuantity,
                  }))
                }
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Name <span className="text-muted-foreground">(required)</span>
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Website hosting — annual"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className={cn(
                  'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-sm)]',
                  'placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring/40'
                )}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown when you copy this to a line item later."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="sku">
                  SKU
                </label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="unit">
                  Unit
                </label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="e.g. hour, ea, kg"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="unitPrice">
                  Unit price ({CURRENCY})
                </label>
                <Input
                  id="unitPrice"
                  inputMode="decimal"
                  value={form.unitPrice}
                  onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="defaultTaxRate">
                  Default VAT %
                </label>
                <Input
                  id="defaultTaxRate"
                  inputMode="decimal"
                  value={form.defaultTaxRate}
                  onChange={(e) => setForm((f) => ({ ...f, defaultTaxRate: e.target.value }))}
                  placeholder="Leave blank to use invoice rate"
                />
              </div>
            </div>

            {form.itemType !== 'service' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="stockQuantity">
                    {form.itemType === 'inventory' ? 'Quantity on hand' : 'On hand (optional)'}
                  </label>
                  <Input
                    id="stockQuantity"
                    inputMode="decimal"
                    value={form.stockQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                    placeholder={form.itemType === 'inventory' ? '0' : 'Track stock'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="costPrice">
                    Unit cost ({CURRENCY})
                  </label>
                  <Input
                    id="costPrice"
                    inputMode="decimal"
                    value={form.costPrice}
                    onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add item'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}
