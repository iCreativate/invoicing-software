import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';
import type { PayrollRunListItem, PayrollRunStatus } from './types';

function coerceStatus(v: unknown): PayrollRunStatus {
  const s = String(v ?? 'draft').toLowerCase();
  return s === 'draft' || s === 'processing' || s === 'paid' ? (s as PayrollRunStatus) : 'draft';
}

export async function fetchPayrollRuns(): Promise<PayrollRunListItem[]> {
  const user = await getBrowserUserSafe();
  const ownerId = user?.id ?? null;
  if (!ownerId) throw new Error('Not signed in.');
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('payroll_runs')
    .select('id,period,pay_date,employees_count,total_amount,currency,status')
    .eq('owner_id', ownerId)
    .order('pay_date', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    period: String(r.period ?? ''),
    payDate: String(r.pay_date ?? ''),
    employeesCount: Number(r.employees_count ?? 0),
    totalAmount: Number(r.total_amount ?? 0),
    currency: String(r.currency ?? 'ZAR'),
    status: coerceStatus(r.status),
  }));
}

export async function createPayrollRun(input: {
  period: string;
  payDate: string;
  employeesCount: number;
  totalAmount: number;
  currency: string;
}) {
  const user = await getBrowserUserSafe();
  const ownerId = user?.id ?? null;
  if (!ownerId) throw new Error('Not signed in.');
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('payroll_runs')
    .insert({
      owner_id: ownerId,
      period: input.period,
      pay_date: input.payDate,
      employees_count: input.employeesCount,
      total_amount: input.totalAmount,
      currency: input.currency,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: String((data as any).id) };
}

