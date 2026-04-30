'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchClientsList } from '@/features/clients/api';
import type { ClientListItem } from '@/features/clients/types';
import { createRecurringSchedule, fetchRecurringList, setRecurringActive, type RecurringScheduleRow } from '@/features/recurring/api';
import { todayISO } from '@/components/invoice/composer/utils';
import { formatMoney } from '@/lib/format/money';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';
import { notifyError, notifySuccess } from '@/lib/notify';

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

  return (
    <AppShell
      title="Recurring invoices"
      actions={
        <Link href={routes.app.invoices}>
          <Button variant="secondary">Invoices</Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="p-5">
          <div className="text-sm font-semibold">Schedules</div>
          <p className="mt-1 text-sm text-muted-foreground">
            A secure cron endpoint generates invoices and can email/WhatsApp links when{' '}
            <code className="text-xs">CRON_SECRET</code> is set. Example:{' '}
            <code className="text-xs">GET /api/cron/recurring?secret=…</code>
          </p>
          {error ? <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-6 text-sm text-muted-foreground">No recurring schedules yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {rows.map((r) => {
                const line = r.quantity * r.unitPrice;
                const vat = line * (r.vatRate / 100);
                const total = line + vat;
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between motion-safe:transition-shadow hover:shadow-[var(--shadow-sm)]"
                  >
                    <div>
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {r.clientName ?? 'Client'} · {r.frequency} · next {r.nextRunDate}
                      </div>
                      <div className="mt-1 text-sm tabular-nums">{formatMoney(total, r.currency)} / run</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Reminders: {r.remindEmail ? 'Email' : ''}
                        {r.remindEmail && r.remindWhatsapp ? ' · ' : ''}
                        {r.remindWhatsapp ? 'WhatsApp' : ''}
                        {!r.remindEmail && !r.remindWhatsapp ? 'Off' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await setRecurringActive(r.id, !r.active);
                            await reload();
                            notifySuccess(r.active ? 'Schedule paused.' : 'Schedule resumed.');
                          } catch (e: unknown) {
                            notifyError(e instanceof Error ? e.message : 'Could not update schedule.');
                          }
                        }}
                      >
                        {r.active ? 'Pause' : 'Resume'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 h-fit">
          <div className="text-sm font-semibold">New schedule</div>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <select
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Line description</label>
              <Input value={lineDescription} onChange={(e) => setLineDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Qty</label>
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit price</label>
                <Input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency</label>
              <select
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Next run</label>
              <Input type="date" value={nextRun} onChange={(e) => setNextRun(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={remindEmail} onChange={(e) => setRemindEmail(e.target.checked)} />
              Remind via email (Resend)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={remindWhatsapp} onChange={(e) => setRemindWhatsapp(e.target.checked)} />
              Remind via WhatsApp (Twilio)
            </label>
            {remindWhatsapp ? (
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="+27… override (else uses client phone)"
              />
            ) : null}
            <Button
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
        </Card>
      </div>
    </AppShell>
  );
}
