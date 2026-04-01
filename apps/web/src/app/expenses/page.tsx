'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatMoney } from '@/lib/format/money';
import {
  categorizeExpenseWithAi,
  createExpense,
  fetchExpensesList,
  uploadExpenseReceipt,
  type ExpenseRow,
} from '@/features/expenses/api';
import { todayISO } from '@/components/invoice/composer/utils';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [category, setCategory] = useState('uncategorized');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  const reload = async () => {
    const list = await fetchExpensesList();
    setItems(list);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await reload();
      } catch (e: any) {
        if (!alive) return;
        const msg = String(e?.message ?? '');
        if (msg.includes('expenses') || msg.includes('schema')) {
          setError('Expense tracking needs table `expenses` from `schema.sql`.');
        } else setError(msg || 'Failed to load expenses.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell title="Expenses">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="text-sm font-semibold">Recent expenses</div>
          <div className="mt-1 text-sm text-muted-foreground">Receipt path is stored when you upload to Storage (optional).</div>

          {error ? <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 text-sm text-muted-foreground">No expenses logged yet.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-foreground">
                    <th className="border-b border-border px-2 py-2">Date</th>
                    <th className="border-b border-border px-2 py-2">Category</th>
                    <th className="border-b border-border px-2 py-2">Description</th>
                    <th className="border-b border-border px-2 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((x) => (
                    <tr key={x.id} className="motion-safe:transition-colors hover:bg-muted/25">
                      <td className="border-b border-border px-2 py-2 text-muted-foreground">{x.expenseDate}</td>
                      <td className="border-b border-border px-2 py-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {x.aiCategory ?? x.category}
                        </span>
                      </td>
                      <td className="border-b border-border px-2 py-2">
                        <div className="flex flex-col gap-1">
                          <span>{x.description ?? '—'}</span>
                          {x.receiptPath ? (
                            <a
                              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                              href={`/api/storage/receipt?path=${encodeURIComponent(x.receiptPath)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View receipt
                            </a>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-b border-border px-2 py-2 text-right tabular-nums font-medium">
                        {formatMoney(x.amount, x.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5 h-fit">
          <div className="text-sm font-semibold">Add expense</div>
          <p className="mt-1 text-sm text-muted-foreground">AI suggests a category from the description (requires ANTHROPIC_API_KEY).</p>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Adobe subscription" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
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
                  setError(null);
                  try {
                    const path = await uploadExpenseReceipt(f);
                    setReceiptPath(path);
                  } catch (err: any) {
                    setError(
                      err?.message ??
                        'Upload failed. Create a private Storage bucket named `receipts` in Supabase with authenticated upload policies.'
                    );
                    setReceiptPath(null);
                  } finally {
                    setReceiptUploading(false);
                  }
                }}
              />
              {receiptPath ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">Attached</span>
                  <button type="button" className="font-medium text-foreground underline" onClick={() => setReceiptPath(null)}>
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={aiBusy || !description.trim()}
                onClick={async () => {
                  setAiBusy(true);
                  try {
                    const cat = await categorizeExpenseWithAi(description, Number(amount));
                    setCategory(cat);
                  } catch {
                    // silent — AI optional
                  } finally {
                    setAiBusy(false);
                  }
                }}
              >
                {aiBusy ? 'Suggesting…' : 'AI categorize'}
              </Button>
            </div>
            <Button
              disabled={saving || !amount || Number(amount) <= 0}
              onClick={async () => {
                setSaving(true);
                try {
                  await createExpense({
                    amount: Number(amount),
                    currency,
                    category,
                    description: description || undefined,
                    expenseDate,
                    aiCategory: category,
                    receiptPath,
                  });
                  setAmount('');
                  setDescription('');
                  setCategory('uncategorized');
                  setReceiptPath(null);
                  await reload();
                } catch (e: any) {
                  setError(e?.message ?? 'Save failed');
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? 'Saving…' : 'Save expense'}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
