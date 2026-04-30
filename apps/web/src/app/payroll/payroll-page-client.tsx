'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { Skeleton } from '@/components/ui/Skeleton';
import { notifyError, notifySuccess } from '@/lib/notify';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import {
  deletePayrollCompensationRow,
  fetchPayrollCompensationRows,
  fetchPayrollRunLines,
  fetchPayrollRuns,
  insertPayrollCompensationRow,
  runPayroll,
  upsertPayrollCompensation,
} from '@/features/payroll/api';
import type { PayrollCompensationRow, PayrollRunLineItem, PayrollRunListItem } from '@/features/payroll/types';
import { fetchEmployeesList } from '@/features/employees/api';
import type { EmployeeListItem } from '@/features/employees/types';
import { computeNetPay } from '@/lib/payroll/calc';
import {
  buildCompensationPrintHtml,
  buildRunLinesPrintHtml,
  compensationToCsv,
  openPayrollPrintWindow,
  runLinesToCsv,
} from '@/lib/payroll/export';
import { ChevronDown, ChevronRight, FileSpreadsheet, FileText, Pencil, Plus, Trash2, Users } from 'lucide-react';

function statusVariant(s: PayrollRunListItem['status']) {
  if (s === 'paid') return 'success';
  if (s === 'processing') return 'primary';
  return 'outline';
}

function defaultPeriodLabel() {
  const d = new Date();
  return d.toLocaleString('en-ZA', { month: 'long', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function PayrollPageClient() {
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const canMutate = capStatus === 'ready' && canEdit;

  const [loading, setLoading] = useState(true);
  const [compRows, setCompRows] = useState<PayrollCompensationRow[]>([]);
  const [runs, setRuns] = useState<PayrollRunListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [runOpen, setRunOpen] = useState(false);
  const [runPeriod, setRunPeriod] = useState(defaultPeriodLabel);
  const [runPayDate, setRunPayDate] = useState(todayISO);
  const [runBusy, setRunBusy] = useState(false);
  const [runErr, setRunErr] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [pickEmployeeId, setPickEmployeeId] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<PayrollCompensationRow | null>(null);
  const [editBase, setEditBase] = useState('');
  const [editBonus, setEditBonus] = useState('');
  const [editDed, setEditDed] = useState('');
  const [editCurrency, setEditCurrency] = useState('ZAR');
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [runLines, setRunLines] = useState<Record<string, PayrollRunLineItem[]>>({});
  const [linesLoading, setLinesLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, r, e] = await Promise.all([fetchPayrollCompensationRows(), fetchPayrollRuns(), fetchEmployeesList()]);
    setCompRows(c);
    setRuns(r);
    setEmployees(e);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load payroll.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const monthlyNetTotal = useMemo(() => compRows.reduce((s, r) => s + r.netPay, 0), [compRows]);
  const monthlyGrossish = useMemo(() => compRows.reduce((s, r) => s + r.baseSalary + r.bonus, 0), [compRows]);
  const totalDeductions = useMemo(() => compRows.reduce((s, r) => s + r.deductions, 0), [compRows]);
  const lastRun = runs[0] ?? null;

  const availableToAdd = useMemo(() => {
    const set = new Set(compRows.map((c) => c.employeeId));
    return employees.filter((e) => !set.has(e.id));
  }, [employees, compRows]);

  const openEdit = (row: PayrollCompensationRow) => {
    setEditRow(row);
    setEditBase(String(row.baseSalary));
    setEditBonus(String(row.bonus));
    setEditDed(String(row.deductions));
    setEditCurrency(row.currency || 'ZAR');
    setEditErr(null);
    setEditOpen(true);
  };

  const onSaveEdit = async () => {
    if (!editRow) return;
    setEditErr(null);
    const base = Number(editBase);
    const bonus = Number(editBonus);
    const ded = Number(editDed);
    if (!Number.isFinite(base) || base < 0 || !Number.isFinite(bonus) || bonus < 0 || !Number.isFinite(ded) || ded < 0) {
      setEditErr('Enter valid non-negative numbers.');
      return;
    }
    setEditBusy(true);
    try {
      await upsertPayrollCompensation({
        employeeId: editRow.employeeId,
        baseSalary: base,
        bonus,
        deductions: ded,
        currency: editCurrency.trim() || 'ZAR',
      });
      await load();
      setEditOpen(false);
      notifySuccess('Payroll entry saved.');
    } catch (e: unknown) {
      setEditErr(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setEditBusy(false);
    }
  };

  const onRemove = async (employeeId: string) => {
    if (!confirm('Remove this person from the payroll worksheet? Their team profile is unchanged.')) return;
    try {
      await deletePayrollCompensationRow(employeeId);
      await load();
      notifySuccess('Removed from payroll.');
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Remove failed.');
    }
  };

  const onAddEmployee = async () => {
    if (!pickEmployeeId) return;
    setAddBusy(true);
    try {
      await insertPayrollCompensationRow(pickEmployeeId);
      await load();
      setAddOpen(false);
      setPickEmployeeId('');
      notifySuccess('Employee added to payroll.');
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Could not add employee.');
    } finally {
      setAddBusy(false);
    }
  };

  const onRunPayroll = async () => {
    setRunErr(null);
    if (!runPeriod.trim()) {
      setRunErr('Period is required.');
      return;
    }
    if (!runPayDate.trim()) {
      setRunErr('Pay date is required.');
      return;
    }
    setRunBusy(true);
    try {
      await runPayroll({ period: runPeriod.trim(), payDate: runPayDate.trim() });
      await load();
      setRunOpen(false);
      notifySuccess('Payroll run completed.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Run failed.';
      setRunErr(msg);
      notifyError(msg);
    } finally {
      setRunBusy(false);
    }
  };

  const toggleRunExpand = async (runId: string) => {
    if (expandedRun === runId) {
      setExpandedRun(null);
      return;
    }
    setExpandedRun(runId);
    if (runLines[runId]) return;
    setLinesLoading(runId);
    try {
      const lines = await fetchPayrollRunLines(runId);
      setRunLines((prev) => ({ ...prev, [runId]: lines }));
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Could not load lines.');
    } finally {
      setLinesLoading(null);
    }
  };

  const exportCompCsv = () => {
    const blob = new Blob([compensationToCsv(compRows, 'Payroll — current worksheet')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-worksheet-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('CSV downloaded.');
  };

  const exportCompPdf = () => {
    openPayrollPrintWindow(
      'Payroll worksheet',
      buildCompensationPrintHtml(compRows, 'TimelyInvoices')
    );
  };

  const exportRunCsv = async (run: PayrollRunListItem) => {
    let lines = runLines[run.id];
    if (!lines?.length) {
      try {
        lines = await fetchPayrollRunLines(run.id);
        setRunLines((prev) => ({ ...prev, [run.id]: lines! }));
      } catch (e: unknown) {
        notifyError(e instanceof Error ? e.message : 'Could not load lines.');
        return;
      }
    }
    if (!lines?.length) {
      notifyError('This run has no line items.');
      return;
    }
    const blob = new Blob(
      [
        runLinesToCsv(lines, {
          period: run.period,
          payDate: run.payDate,
          total: run.totalAmount,
          currency: run.currency,
        }),
      ],
      { type: 'text/csv;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-run-${run.payDate}-${run.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('CSV downloaded.');
  };

  const exportRunPdf = async (run: PayrollRunListItem) => {
    let lines = runLines[run.id];
    if (!lines?.length) {
      try {
        lines = await fetchPayrollRunLines(run.id);
        setRunLines((prev) => ({ ...prev, [run.id]: lines! }));
      } catch (e: unknown) {
        notifyError(e instanceof Error ? e.message : 'Could not load lines.');
        return;
      }
    }
    if (!lines?.length) return;
    openPayrollPrintWindow(
      `Payroll ${run.period}`,
      buildRunLinesPrintHtml(
        lines,
        { period: run.period, payDate: run.payDate, total: run.totalAmount, currency: run.currency },
        'TimelyInvoices'
      )
    );
  };

  const previewNet = editOpen
    ? computeNetPay(Number(editBase) || 0, Number(editBonus) || 0, Number(editDed) || 0)
    : 0;

  return (
    <AppShell
      title="Payroll"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href={routes.app.employees}>
            <Button type="button" variant="secondary">
              <Users className="mr-2 h-4 w-4" />
              Team / HR
            </Button>
          </Link>
          {canMutate ? (
            <>
              <Button type="button" variant="secondary" onClick={exportCompCsv} disabled={!compRows.length}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button type="button" variant="secondary" onClick={exportCompPdf} disabled={!compRows.length}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button type="button" variant="secondary" onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add to payroll
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setRunPeriod(defaultPeriodLabel());
                  setRunPayDate(todayISO());
                  setRunErr(null);
                  setRunOpen(true);
                }}
                disabled={!compRows.length}
              >
                Run payroll
              </Button>
            </>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">{error}</div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5 shadow-[var(--shadow-sm)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly net (worksheet)</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {loading ? '…' : formatMoney(monthlyNetTotal, compRows[0]?.currency ?? 'ZAR')}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Sum of net pay for everyone on the worksheet</p>
          </Card>
          <Card className="p-5 shadow-[var(--shadow-sm)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Headcount</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{loading ? '…' : compRows.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Employees on this payroll worksheet</p>
          </Card>
          <Card className="p-5 shadow-[var(--shadow-sm)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Base + bonus</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {loading ? '…' : formatMoney(monthlyGrossish, compRows[0]?.currency ?? 'ZAR')}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Before deductions</p>
          </Card>
          <Card className="p-5 shadow-[var(--shadow-sm)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last run</div>
            <div className="mt-2 text-lg font-semibold">{loading ? '…' : lastRun ? lastRun.period : '—'}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {lastRun ? `${lastRun.payDate} · ${formatMoney(lastRun.totalAmount, lastRun.currency)}` : 'No runs yet'}
            </p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="border-b border-border bg-muted/15 px-5 py-4">
            <div className="text-sm font-semibold">Payroll worksheet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Set base salary, bonuses, and deductions. Net pay updates automatically. Saved to your workspace.
            </p>
          </div>
          <div className="overflow-x-auto p-5 pt-0">
            <table className="w-full min-w-[920px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="border-b border-border py-3 pr-3">Employee</th>
                  <th className="border-b border-border py-3 pr-3">Email</th>
                  <th className="border-b border-border py-3 pr-3 text-right">Base salary</th>
                  <th className="border-b border-border py-3 pr-3 text-right">Bonus</th>
                  <th className="border-b border-border py-3 pr-3 text-right">Deductions</th>
                  <th className="border-b border-border py-3 pr-3 text-right">Net pay</th>
                  <th className="border-b border-border py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="border-b border-border py-3 pr-3">
                          <Skeleton className="h-5 w-36" />
                        </td>
                        <td className="border-b border-border py-3 pr-3">
                          <Skeleton className="h-5 w-44" />
                        </td>
                        <td className="border-b border-border py-3 pr-3">
                          <Skeleton className="ml-auto h-5 w-20" />
                        </td>
                        <td className="border-b border-border py-3 pr-3">
                          <Skeleton className="ml-auto h-5 w-16" />
                        </td>
                        <td className="border-b border-border py-3 pr-3">
                          <Skeleton className="ml-auto h-5 w-16" />
                        </td>
                        <td className="border-b border-border py-3 pr-3">
                          <Skeleton className="ml-auto h-5 w-20" />
                        </td>
                        <td className="border-b border-border py-3">
                          <Skeleton className="ml-auto h-9 w-20" />
                        </td>
                      </tr>
                    ))
                  : null}
                {!loading && !compRows.length ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No one on payroll yet. Add employees from your team, or invite people under{' '}
                      <Link href={routes.app.employees} className="font-medium text-primary underline">
                        Team / HR
                      </Link>
                      .
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  compRows.map((r) => (
                    <tr key={r.id} className="text-sm">
                      <td className="border-b border-border py-3 pr-3 font-semibold">{r.name}</td>
                      <td className="border-b border-border py-3 pr-3 text-muted-foreground">{r.email}</td>
                      <td className="border-b border-border py-3 pr-3 text-right tabular-nums">{formatMoney(r.baseSalary, r.currency)}</td>
                      <td className="border-b border-border py-3 pr-3 text-right tabular-nums">{formatMoney(r.bonus, r.currency)}</td>
                      <td className="border-b border-border py-3 pr-3 text-right tabular-nums">{formatMoney(r.deductions, r.currency)}</td>
                      <td className="border-b border-border py-3 pr-3 text-right text-base font-semibold tabular-nums">
                        {formatMoney(r.netPay, r.currency)}
                      </td>
                      <td className="border-b border-border py-3 text-right">
                        {canMutate ? (
                          <div className="inline-flex gap-1">
                            <Button type="button" size="sm" variant="secondary" className="h-9" onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="sm" variant="secondary" className="h-9" onClick={() => onRemove(r.employeeId)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
              {!loading && compRows.length > 0 ? (
                <tfoot>
                  <tr className="text-sm font-semibold">
                    <td colSpan={5} className="pt-4 text-right text-muted-foreground">
                      Total deductions
                    </td>
                    <td className="pt-4 text-right tabular-nums">{formatMoney(totalDeductions, compRows[0]?.currency ?? 'ZAR')}</td>
                    <td />
                  </tr>
                  <tr className="text-sm font-semibold">
                    <td colSpan={5} className="pb-3 text-right">
                      Worksheet net total
                    </td>
                    <td className="pb-3 text-right text-base tabular-nums text-primary">{formatMoney(monthlyNetTotal, compRows[0]?.currency ?? 'ZAR')}</td>
                    <td />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="border-b border-border bg-muted/15 px-5 py-4">
            <div className="text-sm font-semibold">Payroll history</div>
            <p className="mt-1 text-sm text-muted-foreground">Each run snapshots salaries and prints totals. Expand a row for line items.</p>
          </div>
          <div className="overflow-x-auto p-5 pt-0">
            <table className="w-full min-w-[800px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="w-10 border-b border-border py-2" />
                  <th className="border-b border-border py-2 pr-3">Period</th>
                  <th className="border-b border-border py-2 pr-3">Pay date</th>
                  <th className="border-b border-border py-2 pr-3">Employees</th>
                  <th className="border-b border-border py-2 pr-3">Status</th>
                  <th className="border-b border-border py-2 text-right">Total net</th>
                  <th className="border-b border-border py-2 text-right">Export</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="py-3">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  : null}
                {!loading && !runs.length ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No payroll runs yet. Complete the worksheet and click Run payroll.
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  runs.map((run) => (
                    <Fragment key={run.id}>
                      <tr className="text-sm">
                        <td className="border-b border-border py-3">
                          <button
                            type="button"
                            className="rounded-lg p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            onClick={() => void toggleRunExpand(run.id)}
                            aria-label="Toggle details"
                          >
                            {expandedRun === run.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="border-b border-border py-3 font-medium">{run.period}</td>
                        <td className="border-b border-border py-3 tabular-nums text-muted-foreground">{run.payDate}</td>
                        <td className="border-b border-border py-3">{run.employeesCount}</td>
                        <td className="border-b border-border py-3">
                          <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                        </td>
                        <td className="border-b border-border py-3 text-right font-semibold tabular-nums">
                          {formatMoney(run.totalAmount, run.currency)}
                        </td>
                        <td className="border-b border-border py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8"
                              onClick={() => void exportRunCsv(run)}
                            >
                              CSV
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-8"
                              onClick={() => void exportRunPdf(run)}
                            >
                              PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedRun === run.id ? (
                        <tr key={`${run.id}-detail`}>
                          <td colSpan={7} className="bg-muted/10 px-4 py-4">
                            {linesLoading === run.id ? (
                              <Skeleton className="h-24 w-full" />
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full min-w-[640px] text-sm">
                                  <thead>
                                    <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold text-muted-foreground">
                                      <th className="px-3 py-2">Employee</th>
                                      <th className="px-3 py-2 text-right">Base</th>
                                      <th className="px-3 py-2 text-right">Bonus</th>
                                      <th className="px-3 py-2 text-right">Deductions</th>
                                      <th className="px-3 py-2 text-right">Net</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(runLines[run.id] ?? []).map((ln) => (
                                      <tr key={ln.id} className="border-b border-border/80">
                                        <td className="px-3 py-2 font-medium">{ln.employeeName}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(ln.baseSalary, ln.currency)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(ln.bonus, ln.currency)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(ln.deductions, ln.currency)}</td>
                                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(ln.netPay, ln.currency)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={runOpen} onOpenChange={setRunOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="text-lg font-semibold">Run payroll</ModalTitle>
            <ModalDescription className="text-sm text-muted-foreground">
              Creates a paid payroll run from the current worksheet and saves a line-item snapshot.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period label</label>
              <Input value={runPeriod} onChange={(e) => setRunPeriod(e.target.value)} placeholder="e.g. April 2026" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay date</label>
              <Input type="date" value={runPayDate} onChange={(e) => setRunPayDate(e.target.value)} />
            </div>
            <div className="rounded-2xl bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
              Total net: <span className="font-semibold text-foreground">{formatMoney(monthlyNetTotal, compRows[0]?.currency ?? 'ZAR')}</span> ·{' '}
              {compRows.length} employee(s)
            </div>
            {runErr ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{runErr}</div> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setRunOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={runBusy} onClick={() => void onRunPayroll()}>
                {runBusy ? 'Running…' : 'Confirm run'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={addOpen} onOpenChange={setAddOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="text-lg font-semibold">Add employee to payroll</ModalTitle>
            <ModalDescription className="text-sm text-muted-foreground">
              Choose someone from your team. Manage invitations under Team / HR.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <select
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={pickEmployeeId}
                onChange={(e) => setPickEmployeeId(e.target.value)}
              >
                <option value="">Select…</option>
                {availableToAdd.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.email})
                  </option>
                ))}
              </select>
            </div>
            {!availableToAdd.length ? (
              <p className="text-sm text-muted-foreground">
                Everyone is already on payroll, or your team list is empty.{' '}
                <Link href={routes.app.employees} className="font-medium text-primary underline">
                  Invite employees
                </Link>
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={addBusy || !pickEmployeeId} onClick={() => void onAddEmployee()}>
                {addBusy ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <Modal open={editOpen} onOpenChange={setEditOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="text-lg font-semibold">Edit payroll — {editRow?.name}</ModalTitle>
            <ModalDescription className="text-sm text-muted-foreground">
              Net pay = base salary + bonus − deductions (never negative).
            </ModalDescription>
          </ModalHeader>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Base salary</label>
              <Input type="number" min={0} step="0.01" value={editBase} onChange={(e) => setEditBase(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bonus</label>
              <Input type="number" min={0} step="0.01" value={editBonus} onChange={(e) => setEditBonus(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deductions</label>
              <Input type="number" min={0} step="0.01" value={editDed} onChange={(e) => setEditDed(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Currency</label>
              <Input value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} placeholder="ZAR" />
            </div>
            <div className="rounded-2xl bg-primary/5 px-3 py-3 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Net pay preview:</span>{' '}
              <span className="text-lg font-semibold tabular-nums">{formatMoney(previewNet, editCurrency || 'ZAR')}</span>
            </div>
            {editErr ? <div className="sm:col-span-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{editErr}</div> : null}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={editBusy} onClick={() => void onSaveEdit()}>
                {editBusy ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}
