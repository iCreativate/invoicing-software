'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format/money';
import { routes } from '@/lib/routing/routes';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { createPayrollRun, fetchPayrollRuns } from '@/features/payroll/api';
import type { PayrollRunListItem } from '@/features/payroll/types';

function statusVariant(s: PayrollRunListItem['status']) {
  if (s === 'paid') return 'success';
  if (s === 'processing') return 'primary';
  return 'outline';
}

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<PayrollRunListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState('May 2026');
  const [payDate, setPayDate] = useState('2026-05-28');
  const [employees, setEmployees] = useState(0);
  const [total, setTotal] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchPayrollRuns();
        if (!alive) return;
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load payroll runs.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => `${r.period} ${r.payDate} ${r.status}`.toLowerCase().includes(q));
  }, [items, query]);

  const totalDraft = useMemo(
    () => filtered.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.totalAmount, 0),
    [filtered]
  );

  return (
    <AppShell
      title="Payroll"
      actions={
        <div className="flex items-center gap-2">
          <Link href={routes.app.employees}>
            <Button variant="secondary">Employees</Button>
          </Link>
          <Button onClick={() => setOpen(true)}>New payroll run</Button>
        </div>
      }
    >
      <div className="grid gap-4">
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Payroll runs</div>
              <div className="mt-1 text-sm text-muted-foreground">{loading ? 'Loading…' : `${filtered.length} run(s)`}</div>
            </div>
            <div className="w-full sm:max-w-sm">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search payroll runs…" />
            </div>
          </div>

          {error ? <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No payroll runs yet. Create your first run.
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-xs font-semibold text-muted-foreground">Upcoming / draft total</div>
              <div className="mt-2 text-xl font-semibold tabular-nums">{formatMoney(totalDraft, 'ZAR')}</div>
              <div className="mt-1 text-xs text-muted-foreground">Excludes paid runs</div>
            </div>
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-xs font-semibold text-muted-foreground">PAYE/UIF/SDL</div>
              <div className="mt-2 text-sm text-muted-foreground">Coming next: statutory calculations.</div>
            </div>
            <div className="rounded-2xl bg-muted/20 p-4">
              <div className="text-xs font-semibold text-muted-foreground">Bank exports</div>
              <div className="mt-2 text-sm text-muted-foreground">Coming next: EFT batch exports.</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="border-b border-border px-3 py-2">Period</th>
                  <th className="border-b border-border px-3 py-2">Pay date</th>
                  <th className="border-b border-border px-3 py-2">Employees</th>
                  <th className="border-b border-border px-3 py-2">Status</th>
                  <th className="border-b border-border px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="border-b border-zinc-100 px-3 py-3 font-semibold dark:border-zinc-900">{r.period}</td>
                    <td className="border-b border-zinc-100 px-3 py-3 tabular-nums dark:border-zinc-900">{r.payDate}</td>
                    <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">{r.employeesCount}</td>
                    <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-3 text-right tabular-nums font-semibold dark:border-zinc-900">
                      {formatMoney(r.totalAmount, r.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-2xl bg-muted/20 p-4 text-sm text-muted-foreground">
            Coming next: payslips, earnings/deductions, statutory compliance, and accountant-ready reporting.
          </div>
        </Card>
      </div>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="text-lg font-semibold">Create payroll run</ModalTitle>
            <ModalDescription className="text-sm text-muted-foreground">
              Draft a payroll run for review (starter UI).
            </ModalDescription>
          </ModalHeader>

          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. May 2026" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay date</label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employees</label>
                <Input type="number" min={1} value={employees} onChange={(e) => setEmployees(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total (ZAR)</label>
                <Input type="number" min={0} step="0.01" value={total} onChange={(e) => setTotal(Number(e.target.value))} />
              </div>
            </div>

            {createError ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{createError}</div> : null}

            <div className="mt-1 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={creating}
                onClick={async () => {
                  setCreateError(null);
                  if (!period.trim()) {
                    setCreateError('Period is required.');
                    return;
                  }
                  if (!payDate.trim()) {
                    setCreateError('Pay date is required.');
                    return;
                  }
                  if (!(employees > 0)) {
                    setCreateError('Employees must be greater than 0.');
                    return;
                  }
                  setCreating(true);
                  try {
                    await createPayrollRun({
                      period: period.trim(),
                      payDate,
                      employeesCount: employees,
                      totalAmount: Number(total ?? 0),
                      currency: 'ZAR',
                    });
                    const list = await fetchPayrollRuns();
                    setItems(list);
                    setOpen(false);
                  } catch (e: any) {
                    setCreateError(e?.message ?? 'Failed to create payroll run.');
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                {creating ? 'Creating…' : 'Create draft'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}

