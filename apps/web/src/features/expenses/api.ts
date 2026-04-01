import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';

export type ExpenseRow = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  receiptPath: string | null;
  aiCategory: string | null;
  expenseDate: string;
};

export async function fetchExpensesList(): Promise<ExpenseRow[]> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('id,amount,currency,category,description,receipt_path,ai_category,expense_date')
    .eq('owner_id', ownerId)
    .order('expense_date', { ascending: false })
    .limit(200);
  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    amount: Number(r.amount ?? 0),
    currency: String(r.currency ?? 'ZAR'),
    category: String(r.category ?? 'uncategorized'),
    description: r.description != null ? String(r.description) : null,
    receiptPath: r.receipt_path ? String(r.receipt_path) : null,
    aiCategory: r.ai_category != null ? String(r.ai_category) : null,
    expenseDate: String(r.expense_date ?? ''),
  }));
}

export async function createExpense(input: {
  amount: number;
  currency: string;
  category: string;
  description?: string;
  expenseDate: string;
  receiptPath?: string | null;
  aiCategory?: string | null;
}): Promise<{ id: string }> {
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
    })
    .select('id')
    .single();
  if (error) throw error;
  return { id: String((data as any).id) };
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
