'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageBody, PageFootnote, PageMain, PageSummary } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { formatMoney } from '@/lib/format/money';
import { cn } from '@/lib/utils/cn';
import {
  categorizeExpenseWithAi,
  createExpense,
  deleteExpense,
  fetchExpensesList,
  updateExpense,
  uploadExpenseReceipt,
} from '@/features/expenses/api';
import {
  EXPENSE_CATEGORY_OPTIONS,
  formatExpenseCategoryLabel,
  type ExpenseRow,
} from '@/features/expenses/types';
import { todayISO } from '@/components/invoice/composer/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { Plus, Pencil, Receipt, Trash2, Filter, Upload, Eye } from 'lucide-react';
import { FileImportDialog } from '@/components/import/FileImportDialog';
import { notifyError, notifySuccess } from '@/lib/notify';

type PeriodFilter = 'all' | 'month' | 'quarter' | 'year';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function filterByPeriod(items: ExpenseRow[], period: PeriodFilter): ExpenseRow[] {
  if (period === 'all') return items;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (period === 'month') {
    const start = startOfMonth(now).toISOString().slice(0, 10);
    return items.filter((x) => x.expenseDate >= start && x.expenseDate <= today);
  }
  if (period === 'quarter') {
    const m = now.getMonth();
    const qStartMonth = Math.floor(m / 3) * 3;
    const start = new Date(now.getFullYear(), qStartMonth, 1).toISOString().slice(0, 10);
    return items.filter((x) => x.expenseDate >= start && x.expenseDate <= today);
  }
  const start = `${now.getFullYear()}-01-01`;
  return items.filter((x) => x.expenseDate >= start && x.expenseDate <= today);
}

type FormState = {
  amount: string;
  currency: string;
  category: string;
  description: string;
  expenseDate: string;
  receiptPath: string | null;
};

const emptyForm = (): FormState => ({
  amount: '',
  currency: 'ZAR',
  category: 'uncategorized',
  description: '',
  expenseDate: todayISO(),
  receiptPath: null,
});

function formFromRow(row: ExpenseRow): FormState {
  return {
    amount: String(row.amount),
    currency: row.currency,
    category: row.category,
    description: row.description ?? '',
    expenseDate: row.expenseDate,
    receiptPath: row.receiptPath,
  };
}

export default function ExpensesPageClient() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [categoryFromAi, setCategoryFromAi] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [viewing, setViewing] = useState<ExpenseRow | null>(null);

  const reload = useCallback(async () => {
    const { items: list, tableMissing: missing } = await fetchExpensesList();
    setItems(list);
    setTableMissing(missing);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await reload();
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load expenses.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reload]);

  const periodItems = useMemo(() => filterByPeriod(items, period), [items, period]);

  const filtered = useMemo(() => {
    let list = periodItems;
    if (categoryFilter !== 'all') {
      list = list.filter((x) => x.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((x) => {
      const blob = `${x.description ?? ''} ${x.category} ${x.aiCategory ?? ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [periodItems, categoryFilter, query]);

  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of filtered) {
      const c = x.currency || 'ZAR';
      map.set(c, (map.get(c) ?? 0) + x.amount);
    }
    return map;
  }, [filtered]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setCategoryFromAi(false);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: ExpenseRow) => {
    setEditingId(row.id);
    setForm(formFromRow(row));
    setCategoryFromAi(false);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditFromView = (row: ExpenseRow) => {
    setViewing(null);
    openEdit(row);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amt = Number(String(form.amount).replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    const cur = form.currency.trim().toUpperCase() || 'ZAR';
    const cat = form.category.trim() || 'uncategorized';
    const aiCat = categoryFromAi ? cat : null;

    setSaving(true);
    try {
      const payload = {
        amount: amt,
        currency: cur,
        category: cat,
        description: form.description.trim() || undefined,
        expenseDate: form.expenseDate,
        receiptPath: form.receiptPath,
        aiCategory: aiCat,
      };
      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }
      setModalOpen(false);
      await reload();
      notifySuccess(editingId ? 'Expense updated.' : 'Expense saved.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed.';
      setFormError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      await reload();
      notifySuccess('Expense deleted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed.';
      setError(msg);
      notifyError(msg);
    }
  };

  const periodLabel: Record<PeriodFilter, string> = {
    all: 'All time',
    month: 'This month',
    quarter: 'This quarter',
    year: 'This year',
  };

  return (
    <AppShell
      title="Expenses"
      actions={
        canMutate ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          </div>
        ) : null
      }
    >
      <PageBody>
        {tableMissing ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-semibold">Database table required</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
              Run the SQL in{' '}
              <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs dark:bg-amber-900/50">apps/web/supabase/expenses.sql</code> in the Supabase SQL
              editor, then refresh this page.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <PageSummary>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from(totalsByCurrency.entries()).map(([cur, sum]) => (
            <Card key={cur} className="border-border p-4 shadow-none">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total ({periodLabel[period]})</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(sum, cur)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{filtered.length} expense(s) in view</div>
            </Card>
          ))}
          {totalsByCurrency.size === 0 && !loading ? (
            <Card className="border-border p-4 shadow-none sm:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</div>
              <div className="mt-1 text-sm text-muted-foreground">No expenses match the current filters.</div>
            </Card>
          ) : null}
        </div>
        </PageSummary>

        <PageMain>
        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Filters</span>
              {(['all', 'month', 'quarter', 'year'] as PeriodFilter[]).map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={period === p ? 'primary' : 'secondary'}
                  className="h-9"
                  onClick={() => setPeriod(p)}
                >
                  {periodLabel[p]}
                </Button>
              ))}
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                <select
                  className={cn(
                    'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-[var(--shadow-sm)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'
                  )}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {EXPENSE_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Description, category…" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Expense log</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {loading ? 'Loading…' : `${filtered.length} row(s)`} · Receipts stored in Supabase Storage when attached.
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 && !tableMissing ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No expenses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Track software, travel, meals, and more for tax and P&amp;L reports.</p>
              {canMutate ? (
                <Button className="mt-4" variant="primary" onClick={openCreate}>
                  Add your first expense
                </Button>
              ) : null}
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 lg:hidden">
                {filtered.map((x) => (
                  <Card key={x.id} className="border border-border p-4 shadow-none">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{x.expenseDate}</div>
                        <div className="mt-1 font-semibold tabular-nums">{formatMoney(x.amount, x.currency)}</div>
                        <div className="mt-1">
                          <Badge variant="outline">{formatExpenseCategoryLabel(x.aiCategory ?? x.category)}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-foreground">{x.description ?? '—'}</div>
                        {x.receiptPath ? (
                          <a
                            className="mt-2 inline-block text-xs font-medium text-primary underline"
                            href={`/api/storage/receipt?path=${encodeURIComponent(x.receiptPath)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View receipt
                          </a>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {x.source === 'import' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-9 px-2"
                            aria-label="View imported expense"
                            onClick={() => setViewing(x)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {canMutate ? (
                          <>
                            <Button type="button" size="sm" variant="secondary" className="h-9 px-2" onClick={() => openEdit(x)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="sm" variant="danger" className="h-9 px-2" onClick={() => void onDelete(x.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-muted-foreground">
                      <th className="border-b border-border px-3 py-2">Date</th>
                      <th className="border-b border-border px-3 py-2">Category</th>
                      <th className="border-b border-border px-3 py-2">Description</th>
                      <th className="border-b border-border px-3 py-2">Receipt</th>
                      <th className="border-b border-border px-3 py-2 text-right">Amount</th>
                      <th className="border-b border-border px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((x) => (
                      <tr key={x.id} className="motion-safe:transition-colors hover:bg-muted/25">
                        <td className="border-b border-border px-3 py-3 text-muted-foreground">{x.expenseDate}</td>
                        <td className="border-b border-border px-3 py-3">
                          <Badge variant="outline">{formatExpenseCategoryLabel(x.aiCategory ?? x.category)}</Badge>
                        </td>
                        <td className="border-b border-border px-3 py-3 text-foreground">{x.description ?? '—'}</td>
                        <td className="border-b border-border px-3 py-3">
                          {x.receiptPath ? (
                            <a
                              className="text-xs font-medium text-primary underline"
                              href={`/api/storage/receipt?path=${encodeURIComponent(x.receiptPath)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="border-b border-border px-3 py-3 text-right tabular-nums font-medium">
                          {formatMoney(x.amount, x.currency)}
                        </td>
                        <td className="border-b border-border px-3 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            {x.source === 'import' ? (
                              <Button type="button" size="sm" variant="secondary" className="h-9" onClick={() => setViewing(x)}>
                                <Eye className="mr-1.5 h-4 w-4" />
                                View
                              </Button>
                            ) : null}
                            {canMutate ? (
                              <>
                                <Button type="button" size="sm" variant="secondary" className="h-9" onClick={() => openEdit(x)}>
                                  Edit
                                </Button>
                                <Button type="button" size="sm" variant="danger" className="h-9" onClick={() => void onDelete(x.id)}>
                                  Delete
                                </Button>
                              </>
                            ) : x.source !== 'import' ? (
                              '—'
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {!loading && items.length > 0 && filtered.length === 0 ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">No expenses match these filters.</div>
          ) : null}
        </Card>
        </PageMain>

        <PageFootnote>
          Categories align with AI suggestions (when configured). Totals reflect the filtered list below.
        </PageFootnote>
      </PageBody>

      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>{editingId ? 'Edit expense' : 'Add expense'}</ModalTitle>
            <ModalDescription>
              Log costs for reporting and tax. Attach a receipt for your records (optional).
            </ModalDescription>
          </ModalHeader>
          <form onSubmit={submitForm} className="mt-2 space-y-4">
            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="exp-amount">
                  Amount
                </label>
                <Input
                  id="exp-amount"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="exp-currency">
                  Currency
                </label>
                <Input
                  id="exp-currency"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="exp-desc">
                Description
              </label>
              <Input
                id="exp-desc"
                value={form.description}
                onChange={(e) => {
                  setCategoryFromAi(false);
                  setForm((f) => ({ ...f, description: e.target.value }));
                }}
                placeholder="e.g. Adobe subscription, flight to Cape Town"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="exp-cat">
                Category
              </label>
              <select
                id="exp-cat"
                className={cn(
                  'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground shadow-[var(--shadow-sm)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'
                )}
                value={form.category}
                onChange={(e) => {
                  setCategoryFromAi(false);
                  setForm((f) => ({ ...f, category: e.target.value }));
                }}
              >
                {EXPENSE_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={aiBusy || !form.description.trim()}
                onClick={async () => {
                  setAiBusy(true);
                  try {
                    const cat = await categorizeExpenseWithAi(form.description, Number(form.amount));
                    setForm((f) => ({ ...f, category: cat }));
                    setCategoryFromAi(true);
                  } catch {
                    // AI optional
                  } finally {
                    setAiBusy(false);
                  }
                }}
              >
                {aiBusy ? 'Suggesting…' : 'AI suggest category'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="exp-date">
                Date
              </label>
              <Input
                id="exp-date"
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Receipt (optional)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
                disabled={receiptUploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  setReceiptUploading(true);
                  setFormError(null);
                  try {
                    const path = await uploadExpenseReceipt(f);
                    setForm((prev) => ({ ...prev, receiptPath: path }));
                  } catch (err: unknown) {
                    const msg =
                      err instanceof Error
                        ? err.message
                        : 'Upload failed. Ensure a private Storage bucket named `receipts` exists in Supabase.';
                    setFormError(msg);
                    notifyError(msg);
                  } finally {
                    setReceiptUploading(false);
                  }
                }}
              />
              {form.receiptPath ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <a
                    href={`/api/storage/receipt?path=${encodeURIComponent(form.receiptPath)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary underline"
                  >
                    Preview attached file
                  </a>
                  <button
                    type="button"
                    className="font-medium text-foreground underline"
                    onClick={() => setForm((f) => ({ ...f, receiptPath: null }))}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving || receiptUploading}>
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save expense'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Imported expense</ModalTitle>
            <ModalDescription>Details from your file import (read-only).</ModalDescription>
          </ModalHeader>
          {viewing ? (
            <div className="mt-2 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium tabular-nums">{viewing.expenseDate}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold tabular-nums">{formatMoney(viewing.amount, viewing.currency)}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Category</span>
                <span>{formatExpenseCategoryLabel(viewing.aiCategory ?? viewing.category)}</span>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Description</div>
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-foreground">{viewing.description ?? '—'}</div>
              </div>
              {viewing.receiptPath ? (
                <a
                  className="inline-flex text-sm font-medium text-primary underline"
                  href={`/api/storage/receipt?path=${encodeURIComponent(viewing.receiptPath)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open receipt
                </a>
              ) : null}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && canMutate ? (
              <Button type="button" variant="primary" onClick={() => openEditFromView(viewing)}>
                Edit
              </Button>
            ) : null}
          </div>
        </ModalContent>
      </Modal>

      <FileImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import expenses"
        description="Upload CSV, Excel, PDF, or an image (screenshot/photo). Text is extracted from PDFs and images; use comma-, tab-, or semicolon-separated columns with a header row. Required: expense_date, amount; optional: currency, category, description."
        endpoint="/api/expenses/import"
        templateHref="/import-templates/timely-expenses.csv"
        onSuccess={() => {
          setPeriod('all');
          void reload();
        }}
      />
    </AppShell>
  );
}
