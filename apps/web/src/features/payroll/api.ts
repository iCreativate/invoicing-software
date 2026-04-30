import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { computeNetPay, roundMoney } from '@/lib/payroll/calc';
import type { PayrollCompensationRow, PayrollRunLineItem, PayrollRunListItem, PayrollRunStatus } from './types';

function coerceStatus(v: unknown): PayrollRunStatus {
  const s = String(v ?? 'draft').toLowerCase();
  return s === 'draft' || s === 'processing' || s === 'paid' ? (s as PayrollRunStatus) : 'draft';
}

export async function fetchPayrollRuns(): Promise<PayrollRunListItem[]> {
  const ownerId = await getWorkspaceOwnerIdForClient();
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

export async function fetchPayrollCompensationRows(): Promise<PayrollCompensationRow[]> {
  const ownerId = await getWorkspaceOwnerIdForClient();
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from('payroll_compensation')
    .select('id,employee_id,base_salary,bonus,deductions,currency,employees(name,email)')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) {
    const msg = String(error.message ?? '').toLowerCase();
    if (msg.includes('payroll_compensation') || msg.includes('relation') || msg.includes('does not exist')) {
      throw new Error(
        'Payroll tables are missing. Run `supabase/payroll-compensation.sql` (or full schema) in your Supabase SQL editor.'
      );
    }
    throw error;
  }

  return (data ?? []).map((row: any) => {
    const e = row.employees as { name?: string; email?: string } | null;
    const base = Number(row.base_salary ?? 0);
    const bonus = Number(row.bonus ?? 0);
    const ded = Number(row.deductions ?? 0);
    const cur = String(row.currency ?? 'ZAR');
    return {
      id: String(row.id),
      employeeId: String(row.employee_id),
      name: String(e?.name ?? 'Employee'),
      email: String(e?.email ?? ''),
      baseSalary: roundMoney(base),
      bonus: roundMoney(bonus),
      deductions: roundMoney(ded),
      netPay: computeNetPay(base, bonus, ded),
      currency: cur,
    };
  });
}

export async function upsertPayrollCompensation(input: {
  employeeId: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  currency?: string;
}): Promise<void> {
  const ownerId = await getWorkspaceOwnerIdForClient();
  const supabase = createSupabaseBrowserClient();
  const currency = input.currency?.trim() || 'ZAR';
  const base = roundMoney(Number(input.baseSalary) || 0);
  const bonus = roundMoney(Number(input.bonus) || 0);
  const ded = roundMoney(Number(input.deductions) || 0);

  const { error } = await supabase.from('payroll_compensation').upsert(
    {
      owner_id: ownerId,
      employee_id: input.employeeId,
      base_salary: base,
      bonus,
      deductions: ded,
      currency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id,employee_id' }
  );

  if (error) throw error;
}

export async function insertPayrollCompensationRow(employeeId: string, currency = 'ZAR'): Promise<void> {
  const ownerId = await getWorkspaceOwnerIdForClient();
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('payroll_compensation').insert({
    owner_id: ownerId,
    employee_id: employeeId,
    base_salary: 0,
    bonus: 0,
    deductions: 0,
    currency,
  });
  if (error) throw error;
}

export async function deletePayrollCompensationRow(employeeId: string): Promise<void> {
  const ownerId = await getWorkspaceOwnerIdForClient();
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('payroll_compensation').delete().eq('owner_id', ownerId).eq('employee_id', employeeId);
  if (error) throw error;
}

export async function fetchPayrollRunLines(runId: string): Promise<PayrollRunLineItem[]> {
  const ownerId = await getWorkspaceOwnerIdForClient();
  const supabase = createSupabaseBrowserClient();

  const { data: run, error: rErr } = await supabase.from('payroll_runs').select('id').eq('id', runId).eq('owner_id', ownerId).maybeSingle();
  if (rErr) throw rErr;
  if (!run) throw new Error('Payroll run not found.');

  const { data, error } = await supabase
    .from('payroll_run_lines')
    .select('id,employee_id,employee_name,base_salary,bonus,deductions,net_pay,currency,sort_order')
    .eq('payroll_run_id', runId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    employeeId: r.employee_id != null ? String(r.employee_id) : null,
    employeeName: String(r.employee_name ?? ''),
    baseSalary: Number(r.base_salary ?? 0),
    bonus: Number(r.bonus ?? 0),
    deductions: Number(r.deductions ?? 0),
    netPay: Number(r.net_pay ?? 0),
    currency: String(r.currency ?? 'ZAR'),
    sortOrder: Number(r.sort_order ?? 0),
  }));
}

export async function runPayroll(input: { period: string; payDate: string }): Promise<{ runId: string }> {
  const res = await fetch('/api/payroll/run', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to run payroll.');
  }
  return { runId: String(json.data?.runId ?? '') };
}
