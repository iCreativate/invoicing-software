import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import type { ExpenseRow } from './types';

export type { ExpenseRow } from './types';

function mapRow(r: Record<string, unknown>): ExpenseRow {
  const src = String(r.source ?? 'manual');
  return {
    id: String(r.id),
    amount: Number(r.amount ?? 0),
    currency: String(r.currency ?? 'ZAR'),
    category: String(r.category ?? 'uncategorized'),
    description: r.description != null ? String(r.description) : null,
    receiptPath: r.receipt_path ? String(r.receipt_path) : null,
    aiCategory: r.ai_category != null ? String(r.ai_category) : null,
    expenseDate: String(r.expense_date ?? ''),
    source: src === 'import' ? 'import' : 'manual',
  };
}

export function isExpensesTableMissing(err: unknown): boolean {
  const m = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  return (
    m.includes('relation') ||
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find') ||
    m.includes("couldn't find")
  );
}

export async function fetchExpensesList(): Promise<{ items: ExpenseRow[]; tableMissing: boolean }> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('id,amount,currency,category,description,receipt_path,ai_category,expense_date,source')
    .eq('owner_id', ownerId)
    .order('expense_date', { ascending: false })
    .limit(500);

  if (error) {
    if (isExpensesTableMissing(error)) return { items: [], tableMissing: true };
    throw error;
  }

  return { items: (data ?? []).map((r) => mapRow(r as Record<string, unknown>)), tableMissing: false };
}

export type ExpenseInput = {
  amount: number;
  currency: string;
  category: string;
  description?: string;
  expenseDate: string;
  receiptPath?: string | null;
  /** Set when the category came from AI suggestion (stored in `ai_category`). */
  aiCategory?: string | null;
};

export async function createExpense(input: ExpenseInput): Promise<{ id: string }> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      owner_id: ownerId,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      description: input.description ?? null,
      expense_date: input.expenseDate,
      receipt_path: input.receiptPath ?? null,
      ai_category: input.aiCategory ?? null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) {
    if (isExpensesTableMissing(error)) {
      throw new Error('Expenses table not found. Run apps/web/supabase/schema.sql (expenses section) in Supabase.');
    }
    throw error;
  }
  return { id: String((data as { id: string }).id) };
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { error } = await supabase
    .from('expenses')
    .update({
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      description: input.description ?? null,
      expense_date: input.expenseDate,
      receipt_path: input.receiptPath ?? null,
      ai_category: input.aiCategory ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', ownerId);

  if (error) {
    if (isExpensesTableMissing(error)) {
      throw new Error('Expenses table not found. Run apps/web/supabase/schema.sql (expenses section) in Supabase.');
    }
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) {
    if (isExpensesTableMissing(error)) {
      throw new Error('Expenses table not found. Run apps/web/supabase/schema.sql (expenses section) in Supabase.');
    }
    throw error;
  }
}

export async function categorizeExpenseWithAi(description: string, amount?: number): Promise<string> {
  const res = await fetch('/api/ai/expense-categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, amount }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error ?? 'AI categorize failed');
  return String(json.category ?? 'uncategorized');
}

export async function uploadExpenseReceipt(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const workspaceOwnerId = await getWorkspaceOwnerIdForClient();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  if (!['png', 'jpg', 'jpeg', 'webp', 'pdf'].includes(ext)) {
    throw new Error('Receipt must be PNG, JPG, WebP, or PDF.');
  }
  const safeName = `${crypto.randomUUID()}.${ext}`;
  const path = `${workspaceOwnerId}/receipts/${safeName}`;

  const { error: upErr } = await supabase.storage.from('receipts').upload(path, file, {
    upsert: false,
    cacheControl: '3600',
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;
  return path;
}
