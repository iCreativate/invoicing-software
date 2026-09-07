'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Surface } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Amount } from '@/components/ui/Text';
import { PageSummary } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { fetchClientsList } from '@/features/clients/api';
import type { ClientListItem } from '@/features/clients/types';
import {
  createRecurringSchedule,
  fetchRecurringList,
  setRecurringActive,
  type RecurringScheduleRow,
} from '@/features/recurring/api';
import { todayISO } from '@/components/invoice/composer/utils';
import { formatMoney } from '@/lib/format/money';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';
import { notifyError, notifySuccess } from '@/lib/notify';
import { MONEY_INVOICE_SUBNAV, MoneySubNav, MoneyWorkspace } from '@/components/money/MoneyWorkspace';
import { MoneyKpiCard, MoneyKpiGrid } from '@/components/money/MoneyKpiCard';
import { RefreshCw, Banknote, PauseCircle, Layers } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function scheduleTotal(r: RecurringScheduleRow) {
  const line = r.quantity * r.unitPrice;
  return line + line * (r.vatRate / 100);
}

function formatNextRun(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export default function RecurringPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RecurringScheduleRow[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('Monthly retainer');
  const [lineDescription, setLineDescription] = useState('Services');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [nextRun, setNextRun] = useState(todayISO());
  const [remindEmail, setRemindEmail] = useState(true);
  const [remindWhatsapp, setRemindWhatsapp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const list = await fetchRecurringList();
    setRows(list);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [list, cl] = await Promise.all([fetchRecurringList(), fetchClientsList()]);
        if (!alive) return;
        setRows(list);
        setClients(cl);
        if (cl[0]) setClientId(cl[0].id);
      } catch (e: any) {
        if (!alive) return;
        const msg = String(e?.message ?? '');
        if (msg.includes('recurring_schedules') || msg.includes('schema')) {
          setError('Recurring invoices require table `recurring_schedules` from `schema.sql`.');
        } else setError(msg || 'Failed to load.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const currency = rows[0]?.currency ?? 'ZAR';
    const active = rows.filter((r) => r.active);
    const paused = rows.length - active.length;
    const perRun = active.reduce((sum, r) => sum + scheduleTotal(r), 0);
    return { currency, active: active.length, paused, perRun, total: rows.length };
  }, [rows]);

  const toggleActive = async (r: RecurringScheduleRow) => {
    try {
      await setRecurringActive(r.id, !r.active);
      await reload();
      notifySuccess(r.active ? 'Schedule paused.' : 'Schedule resumed.');
    } catch (e: unknown) {
      notifyError(e instanceof Error ? e.message : 'Could not update schedule.');
    }
  };

  return (
    <MoneyWorkspace
      title="Recurring"
      description="Automate retainers and repeat invoices on a schedule."
      actions={
        <Button asChild size="sm">
          <Link href={`${routes.app.invoices}/new`}>New invoice</Link>
        </Button>
      }
      subNav={<MoneySubNav items={MONEY_INVOICE_SUBNAV} />}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        <PageSummary>
          <MoneyKpiGrid>
            <MoneyKpiCard
              icon={RefreshCw}
              label="Active"
              value={metrics.active}
              trend={metrics.active === 1 ? 'Schedule running' : 'Schedules running'}
              trendUp={metrics.active > 0}
            />
            <MoneyKpiCard
              icon={Banknote}
              label="Per run"
              value={formatMoney(metrics.perRun, metrics.currency)}
              trend="Across active schedules"
            />
            <MoneyKpiCard
              icon={PauseCircle}
              label="Paused"
              value={metrics.paused}
              trend={metrics.paused > 0 ? 'Ready to resume' : 'None paused'}
            />
            <MoneyKpiCard
              icon={Layers}
              label="Total"
              value={metrics.total}
              trend="In this workspace"
            />
          </MoneyKpiGrid>
        </PageSummary>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <Surface variant="elevated" className="ti-panel ti-invoice-ledger flex min-h-0 flex-1 flex-col">
            <div className="ti-panel-head">
              <SectionHeader
                kicker="Schedules"
                title={`${rows.length} schedule${rows.length === 1 ? '' : 's'}`}
                description="Cron generates invoices and can email or WhatsApp links when configured."
              />
            </div>

            {error ? (
              <div className="ti-error mt-4" role="alert">
                <div className="font-medium">Couldn’t load schedules</div>
                <p className="ti-error-body">{error}</p>
              </div>
            ) : null}

            {loading ? (
              <div className="mt-5 space-y-0" aria-busy="true" aria-label="Loading schedules">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                    <Skeleton className="h-4 w-36 flex-1" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && !error && rows.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  kicker="No schedules"
                  title="Automate your next retainer."
                  description="Create a schedule on the right — invoices generate on the next run date."
                />
              </div>
            ) : null}

            {!loading && rows.length > 0 ? (
              <>
                <div className="mt-4 space-y-3 md:hidden">
                  {rows.map((r) => {
                    const total = scheduleTotal(r);
                    return (
                      <div
                        key={r.id}
                        className="ti-invoice-card"
                        data-tone={r.active ? 'open' : 'draft'}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="ti-invoice-client">{r.title}</div>
                            <div className="ti-invoice-meta">
                              {r.clientName ?? 'Client'} · {r.frequency}
                            </div>
                          </div>
                          <span className={cn('ti-status', r.active ? 'ti-status-sent' : 'ti-status-draft')}>
                            {r.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className="ti-meta">Per run</div>
                            <div className="ti-invoice-amount mt-1">{formatMoney(total, r.currency)}</div>
                          </div>
                          <div className="text-right">
                            <div className="ti-meta">Next</div>
                            <div className="ti-invoice-due mt-1">{formatNextRun(r.nextRunDate)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-[var(--tl-line)] pt-3">
                          <span className="ti-invoice-meta">
                            Reminders:{' '}
                            {[r.remindEmail ? 'Email' : null, r.remindWhatsapp ? 'WhatsApp' : null]
                              .filter(Boolean)
                              .join(' · ') || 'Off'}
                          </span>
                          <Button type="button" size="sm" variant="secondary" onClick={() => void toggleActive(r)}>
                            {r.active ? 'Pause' : 'Resume'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 hidden min-h-0 flex-1 overflow-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Schedule</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Per run</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next</TableHead>
                        <TableHead className="w-28 text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => {
                        const total = scheduleTotal(r);
                        return (
                          <TableRow key={r.id} data-tone={r.active ? 'open' : 'draft'}>
                            <TableCell>
                              <div className="ti-invoice-client">{r.title}</div>
                              <div className="ti-invoice-meta capitalize">
                                {r.frequency}
                                {r.remindEmail || r.remindWhatsapp
                                  ? ` · ${[r.remindEmail ? 'Email' : null, r.remindWhatsapp ? 'WhatsApp' : null]
                                      .filter(Boolean)
                                      .join(' · ')}`
                                  : ' · Reminders off'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="ti-invoice-client">{r.clientName ?? '—'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="ti-invoice-amount">{formatMoney(total, r.currency)}</div>
                            </TableCell>
                            <TableCell>
                              <span className={cn('ti-status', r.active ? 'ti-status-sent' : 'ti-status-draft')}>
                                {r.active ? 'Active' : 'Paused'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="ti-invoice-due">{formatNextRun(r.nextRunDate)}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button type="button" size="sm" variant="secondary" onClick={() => void toggleActive(r)}>
                                {r.active ? 'Pause' : 'Resume'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </Surface>

          <Surface variant="elevated" className="ti-panel h-fit">
            <div className="ti-panel-head">
              <SectionHeader kicker="New schedule" title="Create" description="Set the line, frequency, and next run." />
            </div>
            <div className="mt-4 grid gap-3.5">
              <Field label="Client">
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Client">
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="Line description">
                <Input value={lineDescription} onChange={(e) => setLineDescription(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Qty">
                  <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </Field>
                <Field label="Unit price">
                  <Input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
                </Field>
              </div>
              <Field label="Frequency">
                <Select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                  aria-label="Frequency"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </Select>
              </Field>
              <Field label="Next run">
                <Input type="date" value={nextRun} onChange={(e) => setNextRun(e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-[var(--tl-ink-2)]">
                <input type="checkbox" checked={remindEmail} onChange={(e) => setRemindEmail(e.target.checked)} />
                Remind via email
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--tl-ink-2)]">
                <input
                  type="checkbox"
                  checked={remindWhatsapp}
                  onChange={(e) => setRemindWhatsapp(e.target.checked)}
                />
                Remind via WhatsApp
              </label>
              {remindWhatsapp ? (
                <Input
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+27… override (else uses client phone)"
                />
              ) : null}
              <Button
                className="mt-1"
                disabled={saving || !clientId || !unitPrice || Number(unitPrice) <= 0}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await createRecurringSchedule({
                      clientId,
                      title,
                      lineDescription,
                      quantity: Number(quantity) || 1,
                      unitPrice: Number(unitPrice),
                      vatRate: 15,
                      currency: 'ZAR',
                      frequency,
                      nextRunDate: nextRun,
                      reminderDaysBefore: 3,
                      remindEmail,
                      remindWhatsapp,
                      whatsappPhone: whatsappPhone || null,
                    });
                    await reload();
                    notifySuccess('Recurring schedule created.');
                  } catch (e: any) {
                    const msg = e?.message ?? 'Save failed';
                    setError(msg);
                    notifyError(msg);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? 'Saving…' : 'Save schedule'}
              </Button>
            </div>
          </Surface>
        </div>
      </div>
    </MoneyWorkspace>
  );
}
