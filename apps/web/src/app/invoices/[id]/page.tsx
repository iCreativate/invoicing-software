'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { fetchInvoiceDetail, type InvoiceDetail } from '@/features/invoices/detailApi';
import { getInvoiceStatusClasses, getInvoiceStatusLabel } from '@/features/invoices/status';
import { PayNowButton } from '@/components/payments/PayNowButton';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { suggestSmartReminder } from '@/features/reminders/api';

function StatusPill({ status }: { status: InvoiceDetail['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getInvoiceStatusClasses(status)}`}>
      {getInvoiceStatusLabel(status)}
    </span>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = String((params as any).id);

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reminder, setReminder] = useState<{ channel: 'email' | 'whatsapp'; sendAt: string; message: string; reason: string } | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchInvoiceDetail(invoiceId);
        if (!alive) return;
        setInvoice(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load invoice.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [invoiceId]);

  // Realtime updates for payment + invoice status changes
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const ch = supabase
      .channel(`invoice-${invoiceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `id=eq.${invoiceId}` },
        async () => {
          try {
            const data = await fetchInvoiceDetail(invoiceId);
            setInvoice(data);
          } catch {
            // ignore
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments', filter: `invoice_id=eq.${invoiceId}` },
        async () => {
          try {
            const data = await fetchInvoiceDetail(invoiceId);
            setInvoice(data);
          } catch {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [invoiceId]);

  return (
    <AppShell
      title={invoice?.invoice_number ? `Invoice ${invoice.invoice_number}` : 'Invoice'}
      actions={
        <div className="flex items-center gap-2">
          <Link href={routes.app.invoices}>
            <Button variant="secondary">Back</Button>
          </Link>
          <Link href={`${routes.app.invoices}/${invoiceId}/payments`}>
            <Button>Payments</Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4">
        <Card className="p-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          ) : null}

          {loading ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
          ) : invoice ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={invoice.status} />
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">
                    Client: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{invoice.client?.name ?? '—'}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
                  <div>
                    Issue date: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{invoice.issue_date || '—'}</span>
                  </div>
                  <div>
                    Due date: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{invoice.due_date || '—'}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Smart reminder</div>
                      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        AI suggests the best next reminder channel + time.
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={reminderLoading}
                      onClick={async () => {
                        if (!invoice) return;
                        setReminderLoading(true);
                        try {
                          const r = await suggestSmartReminder({
                            invoice: {
                              id: invoiceId,
                              invoiceNumber: invoice.invoice_number ?? null,
                              status: invoice.status,
                              dueDate: invoice.due_date ?? null,
                              currency: invoice.currency,
                              balance: invoice.balance_amount,
                            },
                            client: {
                              name: invoice.client?.name ?? null,
                              email: (invoice.client as any)?.email ?? null,
                              phone: (invoice.client as any)?.phone ?? null,
                            },
                            now: new Date().toISOString(),
                          });
                          setReminder(r);
                        } catch (e: any) {
                          setError(e?.message ?? 'Failed to get reminder suggestion.');
                        } finally {
                          setReminderLoading(false);
                        }
                      }}
                    >
                      {reminderLoading ? 'Thinking…' : 'Suggest reminder'}
                    </Button>
                  </div>

                  {reminder ? (
                    <div className="mt-4 rounded-2xl bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-muted-foreground">
                          {reminder.channel.toUpperCase()} · Send at {reminder.sendAt}
                        </div>
                        <div className="text-xs text-muted-foreground">{reminder.reason}</div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm">{reminder.message}</div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-muted-foreground">
                          Email uses RESEND_API_KEY; WhatsApp uses Twilio env vars (see .env.example).
                        </div>
                        <Button
                          type="button"
                          disabled={reminderSending}
                          onClick={async () => {
                            if (!invoice) return;
                            const toEmail = (invoice.client as any)?.email ?? null;
                            const toWhatsapp = (invoice.client as any)?.phone ?? null;
                            setReminderSending(true);
                            try {
                              const res = await fetch('/api/reminders/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  channel: reminder.channel,
                                  toEmail,
                                  toWhatsapp,
                                  message: reminder.message,
                                }),
                              });
                              const json = await res.json();
                              if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Send failed');
                            } catch (e: any) {
                              setError(e?.message ?? 'Failed to send reminder.');
                            } finally {
                              setReminderSending(false);
                            }
                          }}
                        >
                          {reminderSending ? 'Sending…' : 'Send now'}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-sm font-semibold">Amounts</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Total</span>
                    <span className="font-semibold">{formatMoney(invoice.total_amount, invoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Paid</span>
                    <span className="font-semibold">{formatMoney(invoice.paid_amount, invoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Balance</span>
                    <span className="font-semibold">{formatMoney(invoice.balance_amount, invoice.currency)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <PayNowButton
                    invoiceId={invoiceId}
                    disabled={!(Number(invoice.balance_amount ?? 0) > 0) || invoice.status === 'paid'}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}

