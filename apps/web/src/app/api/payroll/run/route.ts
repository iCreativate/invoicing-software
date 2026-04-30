import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCanEdit, getWorkspaceContext } from '@/lib/auth/workspace';
import { computeNetPay, roundMoney } from '@/lib/payroll/calc';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }
    try {
      assertCanEdit(ctx);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Forbidden';
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const period = String(body.period ?? '').trim();
    const payDate = String(body.payDate ?? '').trim();
    if (!period) {
      return NextResponse.json({ success: false, error: 'Period is required.' }, { status: 400 });
    }
    if (!payDate) {
      return NextResponse.json({ success: false, error: 'Pay date is required.' }, { status: 400 });
    }

    const { data: compRows, error: compErr } = await supabase
      .from('payroll_compensation')
      .select('employee_id,base_salary,bonus,deductions,currency')
      .eq('owner_id', ctx.workspaceOwnerId);

    if (compErr) {
      const msg = String(compErr.message ?? '').toLowerCase();
      if (msg.includes('relation') || msg.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Payroll tables are missing. Run supabase/payroll-compensation.sql in Supabase.',
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: false, error: compErr.message }, { status: 500 });
    }

    if (!compRows?.length) {
      return NextResponse.json(
        { success: false, error: 'Add at least one employee to payroll before running.' },
        { status: 400 }
      );
    }

    const employeeIds = compRows.map((r: { employee_id: string }) => r.employee_id);
    const { data: emps, error: empErr } = await supabase
      .from('employees')
      .select('id,name,email')
      .eq('owner_id', ctx.workspaceOwnerId)
      .in('id', employeeIds);

    if (empErr) {
      return NextResponse.json({ success: false, error: empErr.message }, { status: 500 });
    }

    const nameById = new Map<string, string>();
    for (const e of emps ?? []) {
      const row = e as { id: string; name: string; email: string };
      nameById.set(String(row.id), String(row.name ?? row.email ?? 'Employee'));
    }

    type Line = {
      employee_id: string;
      employee_name: string;
      base_salary: number;
      bonus: number;
      deductions: number;
      net_pay: number;
      currency: string;
    };

    const lines: Line[] = [];
    let total = 0;
    let currency = 'ZAR';

    for (const raw of compRows) {
      const r = raw as {
        employee_id: string;
        base_salary: number;
        bonus: number;
        deductions: number;
        currency: string | null;
      };
      const base = roundMoney(Number(r.base_salary ?? 0));
      const bonus = roundMoney(Number(r.bonus ?? 0));
      const ded = roundMoney(Number(r.deductions ?? 0));
      const net = computeNetPay(base, bonus, ded);
      total += net;
      const lineCurrency = String(r.currency ?? 'ZAR');
      currency = lineCurrency;
      lines.push({
        employee_id: r.employee_id,
        employee_name: nameById.get(r.employee_id) ?? 'Employee',
        base_salary: base,
        bonus,
        deductions: ded,
        net_pay: net,
        currency: lineCurrency,
      });
    }

    const { data: run, error: runErr } = await supabase
      .from('payroll_runs')
      .insert({
        owner_id: ctx.workspaceOwnerId,
        period,
        pay_date: payDate,
        employees_count: lines.length,
        total_amount: roundMoney(total),
        currency,
        status: 'paid',
      })
      .select('id')
      .single();

    if (runErr || !run) {
      return NextResponse.json({ success: false, error: runErr?.message ?? 'Failed to create payroll run.' }, { status: 500 });
    }

    const runId = String((run as { id: string }).id);

    const lineInserts = lines.map((l, idx) => ({
      payroll_run_id: runId,
      employee_id: l.employee_id,
      employee_name: l.employee_name,
      base_salary: l.base_salary,
      bonus: l.bonus,
      deductions: l.deductions,
      net_pay: l.net_pay,
      currency: l.currency,
      sort_order: idx,
    }));

    const { error: lineErr } = await supabase.from('payroll_run_lines').insert(lineInserts);
    if (lineErr) {
      await supabase.from('payroll_runs').delete().eq('id', runId);
      return NextResponse.json({ success: false, error: lineErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { runId } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to run payroll.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
