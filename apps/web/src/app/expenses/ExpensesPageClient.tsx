'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { PageFootnote, PageSummary } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/lib/format/money';
import { ExpenseForm, EMPTY_EXPENSE_FORM, type ExpenseFormValues } from '@/components/expenses/ExpenseForm';
import {
  createExpense,
  deleteExpense,
  fetchExpensesList,
  updateExpense,
} from '@/features/expenses/api';
import {
  EXPENSE_CATEGORY_OPTIONS,
  formatExpenseCategoryLabel,
  type ExpenseRow,
} from '@/features/expenses/types';
import { todayISO } from '@/components/invoice/composer/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { Plus, Pencil, Receipt, Trash2, Upload, Eye, Calendar, Layers, TrendingDown, Search } from 'lucide-react';
import { FileImportDialog } from '@/components/import/FileImportDialog';
import { notifyError, notifySuccess } from '@/lib/notify';

type PeriodFilter = 'all' | 'month' | 'quarter' | 'year';

const PERIOD_TABS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This year' },
];

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

type FormState = ExpenseFormValues;

const emptyForm = (): FormState => ({ ...EMPTY_EXPENSE_FORM });

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

function formatExpenseDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
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
  const [formInitial, setFormInitial] = useState<FormState>(emptyForm());
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
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

  const monthStats = useMemo(() => {
    const now = new Date();
    const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
    const thisMonth = items.filter((x) => x.expenseDate >= thisStart);
    const prevMonth = items.filter((x) => x.expenseDate >= prevStart && x.expenseDate <= prevEnd);
    const currency = items[0]?.currency || 'ZAR';
    const sum = (rows: ExpenseRow[]) => rows.reduce((s, x) => s + x.amount, 0);
    const cats = new Map<string, number>();
    for (const x of thisMonth) {
      const key = x.aiCategory || x.category || 'uncategorized';
      cats.set(key, (cats.get(key) ?? 0) + x.amount);
    }
    const topCategories = [...cats.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));
    return {
      currency,
      total: sum(items),
      thisMonth: sum(thisMonth),
      prevMonth: sum(prevMonth),
      topCategories,
    };
  }, [items]);

  const openCreate = () => {
    setEditingId(null);
    setFormInitial(emptyForm());
    setFormKey((k) => k + 1);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: ExpenseRow) => {
    setEditingId(row.id);
    setFormInitial(formFromRow(row));
    setFormKey((k) => k + 1);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditFromView = (row: ExpenseRow) => {
    setViewing(null);
    openEdit(row);
  };

  const submitForm = async (data: ExpenseFormValues & { aiCategory: string | null }) => {
    setFormError(null);
    const amt = Number(String(data.amount).replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: amt,
        currency: data.currency.trim().toUpperCase() || 'ZAR',
        category: data.category.trim() || 'uncategorized',
        description: data.description.trim() || undefined,
        expenseDate: data.expenseDate,
        receiptPath: data.receiptPath,
        aiCategory: data.aiCategory,
      };
      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }
      setModalOpen(false);
      setFormKey((k) => k + 1);
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

  const noExpensesAtAll = !loading && items.length === 0 && !tableMissing;

  return (
    <MoneyWorkspace
      actions={
        canMutate ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        {tableMissing ? (
          <div className="ti-error" role="alert">
            <div className="font-medium">Database table required</div>
            <p className="ti-error-body">
              Run the SQL in{' '}
              <code className="rounded bg-[var(--tl-bg)] px-1 py-0.5 text-xs">apps/web/supabase/expenses.sql</code> in
              the Supabase SQL editor, then refresh this page.
            </p>
          </div>
        ) : null}

        <PageSummary>
          <MoneyKpiGrid aria-label="Expense metrics">
            <MoneyKpiCard
              icon={Receipt}
              label="Total expenses"
              value={formatMoney(monthStats.total, monthStats.currency)}
              trend="All time"
            />
            <MoneyKpiCard
              icon={Calendar}
              label="This month"
              value={formatMoney(monthStats.thisMonth, monthStats.currency)}
              trend="Current period"
            />
            <MoneyKpiCard
              icon={TrendingDown}
              label="Previous month"
              value={formatMoney(monthStats.prevMonth, monthStats.currency)}
              trend="For comparison"
            />
            <MoneyKpiCard
              icon={Layers}
              label="Top category"
              value={
                monthStats.topCategories[0]
                  ? formatMoney(monthStats.topCategories[0].amount, monthStats.currency)
                  : '—'
              }
              trend={
                monthStats.topCategories.length === 0
                  ? 'No spend this month'
                  : monthStats.topCategories.map((c) => formatExpenseCategoryLabel(c.category)).join(' · ')
              }
            />
          </MoneyKpiGrid>
        </PageSummary>

        <Surface variant="elevated" className="ti-panel ti-invoice-ledger flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="ti-panel-head">
            <SectionHeader
              kicker="Ledger"
              title={`${filtered.length} expense${filtered.length === 1 ? '' : 's'}`}
              description="Filter by period or category, then open a row to edit."
            />
          </div>

          <div className="ti-invoice-toolbar mt-1">
            <Tabs
              items={PERIOD_TABS.map((p) => ({ value: p.value, label: p.label }))}
              value={period}
              onChange={(v) => setPeriod(v as PeriodFilter)}
            />
            <div className="ti-invoice-toolbar-filters">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-[12.5rem]"
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {EXPENSE_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <div className="relative w-full sm:w-[15rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--tl-ink-3)]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search expenses"
                  className="pl-9"
                  aria-label="Search expenses"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="ti-error mt-4" role="alert">
              <div className="font-medium">Couldn’t load expenses</div>
              <p className="ti-error-body">{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-5 space-y-0" aria-busy="true" aria-label="Loading expenses">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                kicker={noExpensesAtAll ? 'No expenses' : 'No matches'}
                title={
                  noExpensesAtAll
                    ? 'Track software, travel, and meals.'
                    : 'No expenses match these filters.'
                }
                description={
                  noExpensesAtAll
                    ? 'Add costs for tax and P&L reports — attach a receipt when you have one.'
                    : 'Try a different period, category, or search term.'
                }
                action={
                  canMutate && noExpensesAtAll ? (
                    <Button variant="primary" onClick={openCreate}>
                      Add your first expense
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : null}

          {filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((x) => (
                  <div key={x.id} className="ti-invoice-card" data-tone="open">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="ti-invoice-client">{x.description ?? 'Expense'}</div>
                        <div className="ti-invoice-meta mt-1">
                          {formatExpenseDate(x.expenseDate)} ·{' '}
                          {formatExpenseCategoryLabel(x.aiCategory ?? x.category)}
                        </div>
                      </div>
                      <span className="ti-status ti-status-sent">
                        {formatExpenseCategoryLabel(x.aiCategory ?? x.category)}
                      </span>
                    </div>
                    <div className="ti-invoice-amount">{formatMoney(x.amount, x.currency)}</div>
                    <div className="flex items-center justify-between border-t border-[var(--tl-line)] pt-3">
                      {x.receiptPath ? (
                        <a
                          className="text-[13px] font-medium text-[var(--tl-accent)] hover:underline"
                          href={`/api/storage/receipt?path=${encodeURIComponent(x.receiptPath)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View receipt
                        </a>
                      ) : (
                        <span className="ti-invoice-meta">No receipt</span>
                      )}
                      <div className="ti-ledger-actions">
                        {x.source === 'import' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setViewing(x)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        ) : null}
                        {canMutate ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => openEdit(x)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => void onDelete(x.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden min-h-0 flex-1 overflow-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-48 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((x) => (
                      <TableRow key={x.id} className="group" data-tone="open">
                        <TableCell>
                          <div className="ti-invoice-due">{formatExpenseDate(x.expenseDate)}</div>
                        </TableCell>
                        <TableCell>
                          <span className="ti-status ti-status-sent">
                            {formatExpenseCategoryLabel(x.aiCategory ?? x.category)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="ti-invoice-client">{x.description ?? '—'}</div>
                        </TableCell>
                        <TableCell>
                          {x.receiptPath ? (
                            <a
                              className="text-xs font-medium text-[var(--tl-accent)] hover:underline"
                              href={`/api/storage/receipt?path=${encodeURIComponent(x.receiptPath)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="ti-invoice-meta !mt-0">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="ti-invoice-amount">{formatMoney(x.amount, x.currency)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {canMutate || x.source === 'import' ? (
                            <div className="ti-ledger-actions">
                              {x.source === 'import' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setViewing(x)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </Button>
                              ) : null}
                              {canMutate ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => openEdit(x)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => void onDelete(x.id)}
                                  >
                                    Delete
                                  </Button>
                                </>
                              ) : null}
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
        </Surface>

        <PageFootnote>
          Totals above are all-time and monthly. The list follows the filters you select.
        </PageFootnote>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={(next) => {
          setModalOpen(next);
          if (!next) {
            setFormError(null);
            setFormKey((k) => k + 1);
          }
        }}
      >
        <ModalContent className="max-w-3xl p-6 sm:p-7" aria-describedby="expense-form-desc">
          <ModalHeader>
            <ModalTitle className="ti-h3 text-[var(--tl-ink)]">
              {editingId ? 'Edit expense' : 'Add expense'}
            </ModalTitle>
            <ModalDescription id="expense-form-desc" className="text-[13px] text-[var(--tl-ink-3)]">
              Log costs for reporting and tax. Attach a receipt when you have one.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-5">
            <ExpenseForm
              key={`${formKey}-${editingId ?? 'new'}`}
              mode={editingId ? 'edit' : 'create'}
              initialValues={formInitial}
              submitting={saving}
              error={formError}
              onCancel={() => setModalOpen(false)}
              onSubmit={submitForm}
            />
          </div>
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
        description="Bulk import expenses from a spreadsheet, bank export, PDF, or screenshot."
        endpoint="/api/expenses/import"
        templateHref="/import-templates/timely-expenses.csv"
        columnGuide={[
          { name: 'expense_date', required: true, hint: 'YYYY-MM-DD' },
          { name: 'amount', required: true, hint: 'Numeric amount' },
          { name: 'currency', hint: 'Defaults to ZAR' },
          { name: 'category', hint: 'e.g. software, travel, meals' },
          { name: 'description', hint: 'What the spend was for' },
        ]}
        onSuccess={() => {
          setPeriod('all');
          void reload();
        }}
      />
    </MoneyWorkspace>
  );
}
