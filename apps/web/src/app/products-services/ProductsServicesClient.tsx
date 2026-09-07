'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MONEY_INVOICE_SUBNAV, MoneySubNav, MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Amount } from '@/components/ui/Text';
import { PageSummary } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Pencil, Plus, Search, Trash2, Layers, Briefcase, Package, Tag } from 'lucide-react';
import { notifyError, notifySuccess } from '@/lib/notify';

type FilterKey = 'all' | CatalogItemType;

const CURRENCY = 'ZAR';

const TYPE_LABEL: Record<CatalogItemType, string> = {
  service: 'Service',
  product: 'Product',
  inventory: 'Inventory',
};

const FILTER_TABS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'service', label: 'Services' },
  { value: 'product', label: 'Products' },
  { value: 'inventory', label: 'Inventory' },
];

function typeTone(t: CatalogItemType): 'open' | 'paid' | 'draft' {
  if (t === 'service') return 'open';
  if (t === 'inventory') return 'paid';
  return 'draft';
}

function typeStatusClass(t: CatalogItemType) {
  if (t === 'service') return 'ti-status-sent';
  if (t === 'inventory') return 'ti-status-paid';
  return 'ti-status-draft';
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

  const metrics = useMemo(() => {
    const services = items.filter((i) => i.itemType === 'service').length;
    const products = items.filter((i) => i.itemType === 'product').length;
    const inventory = items.filter((i) => i.itemType === 'inventory').length;
    const avgPrice =
      items.length === 0 ? 0 : items.reduce((sum, i) => sum + i.unitPrice, 0) / items.length;
    return { services, products, inventory, avgPrice, total: items.length };
  }, [items]);

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
      notifySuccess(editingId ? 'Item updated.' : 'Item created.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed.';
      setFormError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this catalog item? This cannot be undone.')) return;
    try {
      await deleteCatalogItem(id);
      await load();
      notifySuccess('Item deleted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed.';
      setError(msg);
      notifyError(msg);
    }
  };

  return (
    <MoneyWorkspace
      title="Products"
      description="Services, products, and stock you reuse on invoices."
      actions={
        canMutate ? (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        ) : (
          <Button asChild variant="primary" size="sm">
            <Link href={`${routes.app.invoices}/new`}>New invoice</Link>
          </Button>
        )
      }
      subNav={<MoneySubNav items={MONEY_INVOICE_SUBNAV} />}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        {tableMissing ? (
          <div className="ti-invoice-draft-banner">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--tl-ink)]">Database table required</p>
              <p className="ti-small mt-1">
                Run <code className="text-[12px]">apps/web/supabase/catalog-items.sql</code> in the Supabase
                SQL editor, then refresh.
              </p>
            </div>
          </div>
        ) : null}

        <PageSummary>
          <MoneyKpiGrid>
            <MoneyKpiCard
              icon={Layers}
              label="Catalog"
              value={metrics.total}
              trend="Items ready to bill"
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <MoneyKpiCard
              icon={Briefcase}
              label="Services"
              value={metrics.services}
              trend="Time & fixed fees"
              active={filter === 'service'}
              onClick={() => setFilter('service')}
            />
            <MoneyKpiCard
              icon={Package}
              label="Products"
              value={metrics.products}
              trend="Sellable lines"
              active={filter === 'product'}
              onClick={() => setFilter('product')}
            />
            <MoneyKpiCard
              icon={Tag}
              label="Avg price"
              value={formatMoney(metrics.avgPrice, CURRENCY)}
              trend={`${metrics.inventory} inventory SKU${metrics.inventory === 1 ? '' : 's'}`}
              active={filter === 'inventory'}
              onClick={() => setFilter('inventory')}
            />
          </MoneyKpiGrid>
        </PageSummary>

        <Surface variant="elevated" className="ti-panel ti-invoice-ledger flex min-h-0 flex-1 flex-col">
          <div className="ti-panel-head">
            <SectionHeader
              kicker="Catalog"
              title={`${filtered.length} item${filtered.length === 1 ? '' : 's'}`}
              description={
                filter === 'all'
                  ? 'Services, products, and stock for invoice lines.'
                  : `Showing ${FILTER_TABS.find((t) => t.value === filter)?.label.toLowerCase()}.`
              }
            />
          </div>

          <div className="ti-invoice-toolbar mt-1">
            <Tabs
              items={FILTER_TABS.map((t) => ({ value: t.value, label: t.label }))}
              value={filter}
              onChange={(v) => setFilter(v as FilterKey)}
            />
            <div className="relative sm:min-w-[16rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--tl-ink-3)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, SKU, description"
                className="pl-9"
                aria-label="Search catalog"
              />
            </div>
          </div>

          {error ? (
            <div className="ti-error mt-4" role="alert">
              <div className="font-medium">Couldn’t load catalog</div>
              <p className="ti-error-body">{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 space-y-0" aria-busy="true" aria-label="Loading catalog">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !tableMissing && filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                kicker={items.length === 0 ? 'Empty catalog' : 'No matches'}
                title={items.length === 0 ? 'Add your first billable item.' : 'Nothing matches these filters.'}
                description={
                  items.length === 0
                    ? 'Services, products, and inventory reuse cleanly on invoices and quotes.'
                    : 'Try a different type or search term.'
                }
                action={
                  canMutate && items.length === 0 ? (
                    <Button variant="primary" onClick={openCreate}>
                      Add item
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((row) => (
                  <div key={row.id} className="ti-invoice-card" data-tone={typeTone(row.itemType)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="ti-invoice-client">{row.name}</div>
                        {row.description ? (
                          <div className="ti-invoice-meta line-clamp-2">{row.description}</div>
                        ) : null}
                        {row.sku ? <div className="ti-invoice-meta">SKU {row.sku}</div> : null}
                      </div>
                      <span className={cn('ti-status', typeStatusClass(row.itemType))}>
                        {TYPE_LABEL[row.itemType]}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="ti-meta">Price</div>
                        <div className="ti-invoice-amount mt-1">{formatMoney(row.unitPrice, CURRENCY)}</div>
                        {row.unit ? <div className="ti-invoice-amount-sub text-left">per {row.unit}</div> : null}
                      </div>
                      {row.itemType !== 'service' ? (
                        <div className="text-right">
                          <div className="ti-meta">Stock</div>
                          <div className="ti-invoice-due mt-1">
                            {row.stockQuantity != null ? `${row.stockQuantity} on hand` : '—'}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {canMutate ? (
                      <div className="flex items-center justify-end gap-2 border-t border-[var(--tl-line)] pt-3">
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => void onDelete(row.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden min-h-0 flex-1 overflow-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock / cost</TableHead>
                      <TableHead className="w-36 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id} className="group" data-tone={typeTone(row.itemType)}>
                        <TableCell>
                          <div className="ti-invoice-client">{row.name}</div>
                          {row.description ? (
                            <div className="ti-invoice-meta line-clamp-2 max-w-md">{row.description}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className={cn('ti-status', typeStatusClass(row.itemType))}>
                            {TYPE_LABEL[row.itemType]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="ti-invoice-meta !mt-0 font-mono text-[12.5px]">
                            {row.sku ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="ti-invoice-amount">{formatMoney(row.unitPrice, CURRENCY)}</div>
                          {row.unit ? <div className="ti-invoice-amount-sub">per {row.unit}</div> : null}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.itemType === 'service' ? (
                            <span className="ti-invoice-meta !mt-0">—</span>
                          ) : (
                            <>
                              <div className="ti-invoice-due">
                                {row.stockQuantity != null ? `${row.stockQuantity} on hand` : '—'}
                              </div>
                              {row.costPrice != null ? (
                                <div className="ti-invoice-due-meta">
                                  Cost {formatMoney(row.costPrice, CURRENCY)}
                                </div>
                              ) : null}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canMutate ? (
                            <div className="flex items-center justify-end gap-1 opacity-100 xl:opacity-0 xl:transition-opacity xl:duration-[var(--ti-duration-hover)] xl:group-hover:opacity-100 xl:group-focus-within:opacity-100">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2.5 text-[12.5px]"
                                onClick={() => openEdit(row)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2.5 text-[12.5px] text-[var(--tl-danger)]"
                                onClick={() => void onDelete(row.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          ) : (
                            <span className="ti-invoice-meta !mt-0">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          <p className="ti-small mt-5 border-t border-[var(--tl-line)] pt-4 text-[var(--tl-ink-3)]">
            Link inventory on invoice lines to decrease on-hand quantity when you send. Services and products are
            pricing references unless linked the same way.
          </p>
        </Surface>
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
              <div className="ti-error" role="alert">
                <p className="ti-error-body">{formError}</p>
              </div>
            ) : null}

            <Field label="Type" htmlFor="itemType">
              <Select
                id="itemType"
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
              </Select>
            </Field>

            <Field label="Name" htmlFor="name" hint="Required">
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Website hosting — annual"
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Shown when you copy this to a line item later."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SKU" htmlFor="sku">
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Unit" htmlFor="unit">
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="e.g. hour, ea, kg"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Unit price (${CURRENCY})`} htmlFor="unitPrice">
                <Input
                  id="unitPrice"
                  inputMode="decimal"
                  value={form.unitPrice}
                  onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                />
              </Field>
              <Field label="Default VAT %" htmlFor="defaultTaxRate">
                <Input
                  id="defaultTaxRate"
                  inputMode="decimal"
                  value={form.defaultTaxRate}
                  onChange={(e) => setForm((f) => ({ ...f, defaultTaxRate: e.target.value }))}
                  placeholder="Leave blank for invoice rate"
                />
              </Field>
            </div>

            {form.itemType !== 'service' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={form.itemType === 'inventory' ? 'Quantity on hand' : 'On hand (optional)'}
                  htmlFor="stockQuantity"
                >
                  <Input
                    id="stockQuantity"
                    inputMode="decimal"
                    value={form.stockQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                    placeholder={form.itemType === 'inventory' ? '0' : 'Track stock'}
                  />
                </Field>
                <Field label={`Unit cost (${CURRENCY})`} htmlFor="costPrice">
                  <Input
                    id="costPrice"
                    inputMode="decimal"
                    value={form.costPrice}
                    onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                    placeholder="Optional"
                  />
                </Field>
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
    </MoneyWorkspace>
  );
}
