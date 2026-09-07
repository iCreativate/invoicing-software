'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  FileText,
  Paperclip,
  Receipt,
  Sparkles,
  Tag,
  Upload,
  X,
} from 'lucide-react';
import { AdminAlertBanner } from '@/components/workspace/workspace-ui';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Amount } from '@/components/ui/Text';
import {
  categorizeExpenseWithAi,
  uploadExpenseReceipt,
} from '@/features/expenses/api';
import {
  EXPENSE_CATEGORY_OPTIONS,
  formatExpenseCategoryLabel,
} from '@/features/expenses/types';
import { todayISO } from '@/components/invoice/composer/utils';
import { formatMoney } from '@/lib/format/money';
import { notifyError } from '@/lib/notify';
import { cn } from '@/lib/utils/cn';

export type ExpenseFormValues = {
  amount: string;
  currency: string;
  category: string;
  description: string;
  expenseDate: string;
  receiptPath: string | null;
};

export const EMPTY_EXPENSE_FORM: ExpenseFormValues = {
  amount: '',
  currency: 'ZAR',
  category: 'uncategorized',
  description: '',
  expenseDate: todayISO(),
  receiptPath: null,
};

const QUICK_CATEGORIES = ['software', 'travel', 'meals', 'office', 'marketing', 'professional_services'];

function formatPreviewDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function ExpensePreviewCard({ values, categoryFromAi }: { values: ExpenseFormValues; categoryFromAi: boolean }) {
  const amt = Number(String(values.amount).replace(',', '.'));
  const hasAmount = Number.isFinite(amt) && amt > 0;
  const category = formatExpenseCategoryLabel(values.category);

  return (
    <div className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-surface)] shadow-[var(--shadow-elevated)]">
      <div className="border-b border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3">
        <p className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Expense preview</p>
        <p className="mt-1 text-[12px] text-[var(--tl-ink-3)]">How this will appear in your ledger</p>
      </div>
      <div className="p-4">
        {hasAmount ? (
          <Amount display className="!text-[clamp(1.2rem,2vw,1.5rem)] leading-tight text-[var(--tl-ink)]">
            {formatMoney(amt, values.currency || 'ZAR')}
          </Amount>
        ) : (
          <p className="text-[15px] font-semibold text-[var(--tl-ink-3)]">Enter an amount</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[var(--tl-ink-3)]">
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tl-line)] bg-[var(--tl-bg)] px-2 py-0.5 font-medium text-[var(--tl-ink-2)]">
            <Tag className="h-3 w-3" aria-hidden />
            {category}
            {categoryFromAi ? ' · AI' : ''}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tl-line)] bg-[var(--tl-bg)] px-2 py-0.5 font-medium text-[var(--tl-ink-2)]">
            <Calendar className="h-3 w-3" aria-hidden />
            {formatPreviewDate(values.expenseDate)}
          </span>
        </div>
        {values.description.trim() ? (
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--tl-ink-2)]">{values.description.trim()}</p>
        ) : (
          <p className="mt-3 text-[13px] text-[var(--tl-ink-3)]">Add a description for easier searching later.</p>
        )}
        <div className="mt-4 flex items-center gap-2 border-t border-[var(--tl-line)] pt-3 text-[12px] text-[var(--tl-ink-3)]">
          <Paperclip className="h-3.5 w-3.5" aria-hidden />
          {values.receiptPath ? 'Receipt attached' : 'No receipt yet'}
        </div>
      </div>
    </div>
  );
}

export function ExpenseForm({
  mode = 'create',
  initialValues = EMPTY_EXPENSE_FORM,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}: {
  mode?: 'create' | 'edit';
  initialValues?: ExpenseFormValues;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (data: ExpenseFormValues & { aiCategory: string | null }) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormValues>(initialValues);
  const [categoryFromAi, setCategoryFromAi] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayError = error ?? localError;
  const canSubmit = !submitting && !receiptUploading;

  const set = <K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleReceipt = async (file: File) => {
    setReceiptUploading(true);
    setLocalError(null);
    try {
      const path = await uploadExpenseReceipt(file);
      set('receiptPath', path);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Upload failed. Ensure a private Storage bucket named `receipts` exists in Supabase.';
      setLocalError(msg);
      notifyError(msg);
    } finally {
      setReceiptUploading(false);
    }
  };

  const suggestCategory = async () => {
    if (!form.description.trim()) return;
    setAiBusy(true);
    try {
      const cat = await categorizeExpenseWithAi(form.description, Number(form.amount));
      set('category', cat);
      setCategoryFromAi(true);
    } catch {
      // AI optional
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const amt = Number(String(form.amount).replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      setLocalError('Enter a valid amount greater than zero.');
      return;
    }
    await onSubmit({
      ...form,
      currency: form.currency.trim().toUpperCase() || 'ZAR',
      category: form.category.trim() || 'uncategorized',
      aiCategory: categoryFromAi ? form.category.trim() || 'uncategorized' : null,
    });
  };

  const tips = useMemo(
    () =>
      mode === 'create'
        ? 'Receipts are optional but help with VAT claims and audits.'
        : 'Changes update your expense reports immediately.',
    [mode]
  );

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => void handleSubmit(e)}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] lg:gap-6">
        <div className="grid gap-5">
          <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tl-navy)_10%,white)] text-[var(--tl-navy)]">
              <Receipt className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--tl-ink)]">
                {mode === 'edit' ? 'Update expense' : 'Log a business expense'}
              </p>
              <p className="text-[13px] text-[var(--tl-ink-3)]">{tips}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_5.5rem]">
          <Field label="Amount" htmlFor="exp-amount">
            <Input
              id="exp-amount"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="0.00"
              className="ti-amount text-[15px] font-semibold"
              autoFocus
            />
          </Field>
          <Field label="Currency" htmlFor="exp-currency">
            <Input
              id="exp-currency"
              value={form.currency}
              onChange={(e) => set('currency', e.target.value.toUpperCase())}
              maxLength={3}
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="exp-desc" hint="What was this spend for?">
          <Textarea
            id="exp-desc"
            value={form.description}
            onChange={(e) => {
              setCategoryFromAi(false);
              set('description', e.target.value);
            }}
            placeholder="e.g. Adobe subscription, flight to Cape Town"
            rows={2}
          />
        </Field>

        <Field
          label="Category"
          htmlFor="exp-cat"
          hint="Pick a category for P&L and tax reporting."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_CATEGORIES.map((value) => {
                const label = formatExpenseCategoryLabel(value);
                const active = form.category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setCategoryFromAi(false);
                      set('category', value);
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                    active
                      ? 'border-[color-mix(in_srgb,var(--tl-navy)_35%,var(--tl-line))] bg-[color-mix(in_srgb,var(--tl-navy)_8%,white)] text-[var(--tl-ink)]'
                        : 'border-[var(--tl-line)] bg-[var(--tl-surface)] text-[var(--tl-ink-2)] hover:border-[color-mix(in_srgb,var(--tl-navy)_20%,var(--tl-line))]'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                id="exp-cat"
                value={form.category}
                onChange={(e) => {
                  setCategoryFromAi(false);
                  set('category', e.target.value);
                }}
                className="min-w-0 flex-1"
              >
                {EXPENSE_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={aiBusy || !form.description.trim()}
                loading={aiBusy}
                onClick={() => void suggestCategory()}
                className="shrink-0"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                AI suggest
              </Button>
            </div>
          </div>
        </Field>

        <Field label="Expense date" htmlFor="exp-date">
          <Input
            id="exp-date"
            type="date"
            value={form.expenseDate}
            onChange={(e) => set('expenseDate', e.target.value)}
            max={todayISO()}
          />
        </Field>

        <Field label="Receipt" hint="PNG, JPEG, WebP, or PDF — up to your storage limit.">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="sr-only"
            disabled={receiptUploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void handleReceipt(f);
            }}
          />
          {form.receiptPath ? (
            <div className="flex items-center justify-between gap-3 rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tl-success)_12%,white)] text-[var(--tl-success)]">
                  <FileText className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--tl-ink)]">Receipt attached</p>
                  <a
                    href={`/api/storage/receipt?path=${encodeURIComponent(form.receiptPath)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] font-medium text-[var(--tl-accent)] hover:underline"
                  >
                    Preview file
                  </a>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-[var(--tl-ink-3)] hover:bg-[var(--tl-surface)] hover:text-[var(--tl-ink)]"
                aria-label="Remove receipt"
                onClick={() => set('receiptPath', null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={receiptUploading}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void handleReceipt(f);
              }}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-2 rounded-[var(--tl-radius-sm)] border border-dashed px-4 py-8 text-center transition-colors',
                dragOver
                  ? 'border-[color-mix(in_srgb,var(--tl-navy)_40%,var(--tl-line))] bg-[color-mix(in_srgb,var(--tl-navy)_6%,white)]'
                  : 'border-[var(--tl-line)] bg-[var(--tl-bg)] hover:border-[color-mix(in_srgb,var(--tl-navy)_25%,var(--tl-line))]'
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tl-surface)] text-[var(--tl-ink-2)]">
                <Upload className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[13px] font-semibold text-[var(--tl-ink)]">
                {receiptUploading ? 'Uploading…' : 'Drop receipt here or browse'}
              </span>
              <span className="text-[12px] text-[var(--tl-ink-3)]">PDF or image file</span>
            </button>
          )}
        </Field>

        {displayError ? <AdminAlertBanner tone="error">{displayError}</AdminAlertBanner> : null}
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <ExpensePreviewCard values={form} categoryFromAi={categoryFromAi} />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[var(--tl-line)] pt-4 sm:flex-row sm:items-center sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={!canSubmit} className="w-full sm:w-auto">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={!canSubmit} loading={submitting} className="w-full sm:w-auto">
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save expense'}
        </Button>
      </div>
    </form>
  );
}
