'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { getInvoiceStatusClasses, getInvoiceStatusLabel } from '@/features/invoices/status';
import type { InvoiceStatus } from '@/features/invoices/types';
import { PayNowButton } from '@/components/payments/PayNowButton';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { suggestSmartReminder } from '@/features/reminders/api';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { invoiceApiToPreviewDraft } from '@/features/invoices/previewMap';
import { fetchMyCompanyProfile, subscriptionShowsPoweredBy } from '@/features/company/api';
import type { CompanyProfile } from '@/features/company/types';
import { CheckCircle2, Circle, Download, Pencil } from 'lucide-react';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';

function StatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getInvoiceStatusClasses(status)}`}>
      {getInvoiceStatusLabel(status)}
    </span>
  );
}

const TIMELINE_LABELS: Record<string, string> = {
  created: 'Created',
  sent: 'Sent',
  viewed: 'Viewed by client',
  paid: 'Paid',
  updated: 'Updated',
  reminder_sent: 'Reminder sent',
};

type TimelineEntry = { type: string; at: string; source?: string; meta?: Record<string, unknown> };

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = String((params as any).id);
  const { canEdit, canRecordPayments, status: capStatus } = useWorkspaceCapabilities();
  const allowEdit = capStatus === 'ready' && canEdit;
  const allowPaymentActions = capStatus === 'ready' && canRecordPayments;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [reminder, setReminder] = useState<{ channel: 'email' | 'whatsapp'; sendAt: string; message: string; reason: string } | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/invoices/${invoiceId}`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to load invoice.');
    setInvoice(json.data.invoice);
    setTimeline(json.data.timeline ?? []);
  }, [invoiceId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await load();
        const co = await fetchMyCompanyProfile();
        if (!alive) return;
        setCompany(co);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load invoice.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const ch = supabase
      .channel(`invoice-detail-${invoiceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `id=eq.${invoiceId}` },
        () => {
          void load().catch(() => {});
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments', filter: `invoice_id=eq.${invoiceId}` },
        () => {
          void load().catch(() => {});
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoice_timeline_events', filter: `invoice_id=eq.${invoiceId}` },
        () => {
          void load().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [invoiceId, load]);

  const draft = invoice ? invoiceApiToPreviewDraft(invoice) : null;
  const client = invoice?.client ?? {};
  const poweredBy = subscriptionShowsPoweredBy(company?.subscriptionPlan ?? null);

  return (
    <AppShell
      title={invoice?.invoice_number ? `Invoice ${invoice.invoice_number}` : 'Invoice'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href={routes.app.invoices}>
            <Button variant="secondary">Back</Button>
          </Link>
          {allowEdit ? (
            <Link href={`${routes.app.invoices}/${invoiceId}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          ) : null}
          <Link href={`${routes.app.invoices}/${invoiceId}/print`} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </Link>
          <Link href={`${routes.app.invoices}/${invoiceId}/payments`}>
            <Button variant="secondary">Payments</Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-6">
        <Card className="p-4 sm:p-6">
          {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : invoice ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={invoice.status as InvoiceStatus} />
                  <div className="text-sm text-muted-foreground">
                    Client:{' '}
                    <span className="font-semibold text-foreground">{client.name ?? '—'}</span>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    Issue date: <span className="font-semibold text-foreground">{invoice.issue_date || '—'}</span>
                  </div>
                  <div>
                    Due date: <span className="font-semibold text-foreground">{invoice.due_date || '—'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold">Timeline</div>
                  <p className="mt-1 text-xs text-muted-foreground">Created, delivery, views, and payment milestones.</p>
                  <ol className="relative mt-4 space-y-0 border-l border-border pl-6">
                    {timeline.length === 0 ? (
                      <li className="text-sm text-muted-foreground">No timeline events yet.</li>
                    ) : (
                      timeline.map((ev, idx) => (
                        <li key={`${ev.type}-${ev.at}-${idx}`} className="mb-6 ml-1 last:mb-0">
                          <span className="absolute -left-[9px] mt-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background">
                            {ev.type === 'paid' ? (
                              <CheckCircle2 className="h-3 w-3 text-success" />
                            ) : (
                              <Circle className="h-2.5 w-2.5 text-muted-foreground" />
                            )}
                          </span>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {TIMELINE_LABELS[ev.type] ?? ev.type}
                            </span>
                            <time className="text-xs tabular-nums text-muted-foreground">
                              {new Date(ev.at).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: ev.type === 'created' || ev.type === 'sent' ? 'short' : undefined,
                              })}
                            </time>
                          </div>
                          {ev.source === 'synthetic' ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">From invoice record</p>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ol>
                </div>

                <div id="reminder" className="scroll-mt-24 rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Smart reminder</div>
                      <div className="mt-1 text-sm text-muted-foreground">AI suggests channel and timing.</div>
                    </div>
                    {allowEdit ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={reminderLoading}
                      onClick={async () => {
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
                              name: client.name ?? null,
                              email: client.email ?? null,
                              phone: client.phone ?? null,
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
                    ) : (
                      <p className="text-xs text-muted-foreground">Read-only: reminders cannot be sent.</p>
                    )}
                  </div>

                  {reminder && allowEdit ? (
                    <div className="mt-4 rounded-2xl bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-muted-foreground">
                          {reminder.channel.toUpperCase()} · Send at {reminder.sendAt}
                        </div>
                        <div className="text-xs text-muted-foreground">{reminder.reason}</div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm">{reminder.message}</div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          type="button"
                          disabled={reminderSending}
                          onClick={async () => {
                            const toEmail = client.email ?? null;
                            const toWhatsapp = client.phone ?? null;
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
                                  invoiceId,
                                }),
                              });
                              const json = await res.json();
                              if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Send failed');
                              await load();
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

                {draft ? (
                  <div>
                    <div className="mb-3 text-sm font-semibold">Preview</div>
                    <div className="overflow-x-auto rounded-xl border border-border bg-muted/10 p-2">
                      <InvoicePreview
                        companyName={company?.companyName ?? 'TimelyInvoices'}
                        companyLogoPath={company?.logoUrl ?? null}
                        companyDetails={
                          company
                            ? {
                                email: company.email,
                                phone: company.phone,
                                address: company.address,
                                website: company.website,
                                vatNumber: company.vatNumber,
                                bankName: company.bankName,
                                accountName: company.accountName,
                                accountNumber: company.accountNumber,
                                branchCode: company.branchCode,
                                accountType: company.accountType,
                              }
                            : null
                        }
                        draft={draft}
                        client={{
                          name: String(client.name ?? '—'),
                          email: client.email ?? null,
                          phone: client.phone ?? null,
                          address: client.address ?? null,
                          companyName: (client as any).company_name ?? (client as any).companyName ?? null,
                          website: (client as any).website ?? null,
                          companyRegistration: (client as any).company_registration ?? (client as any).companyRegistration ?? null,
                          vatNumber: (client as any).vat_number ?? (client as any).vatNumber ?? null,
                        }}
                        showPoweredBy={poweredBy}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border p-4 lg:h-fit">
                <div className="text-sm font-semibold">Amounts</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold tabular-nums">{formatMoney(invoice.total_amount, invoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-semibold tabular-nums">{formatMoney(invoice.paid_amount, invoice.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-semibold tabular-nums">{formatMoney(invoice.balance_amount, invoice.currency)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  {allowPaymentActions ? (
                    <PayNowButton
                      invoiceId={invoiceId}
                      disabled={!(Number(invoice.balance_amount ?? 0) > 0) || invoice.status === 'paid'}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">Payment links are hidden for read-only users.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
