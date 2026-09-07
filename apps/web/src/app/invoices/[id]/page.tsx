'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHero } from '@/components/layout/AppPageHero';
import { Amount } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import type { InvoiceStatus } from '@/features/invoices/types';
import { PayNowButton } from '@/components/payments/PayNowButton';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { suggestSmartReminder } from '@/features/reminders/api';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { StatusBadge } from '@/components/invoice/StatusBadge';
import { invoiceApiToPreviewDraft } from '@/features/invoices/previewMap';
import { buildPublicInvoiceViewUrl } from '@/lib/invoice/platformUrls';
import { fetchMyCompanyProfile, subscriptionShowsPoweredBy } from '@/features/company/api';
import { mapCompanyProfileToPreviewDetails } from '@/features/company/previewDetails';
import type { CompanyProfile } from '@/features/company/types';
import { notifyError, notifySuccess } from '@/lib/notify';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';

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
  const invoiceId = String((params as { id?: string }).id);
  const { canEdit, canRecordPayments, status: capStatus } = useWorkspaceCapabilities();
  const allowEdit = capStatus === 'ready' && canEdit;
  const allowPaymentActions = capStatus === 'ready' && canRecordPayments;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [reminder, setReminder] = useState<{
    channel: 'email' | 'whatsapp';
    sendAt: string;
    message: string;
    reason: string;
  } | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [sending, setSending] = useState(false);

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
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load invoice.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    if (isDemoUiActive()) return;
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
  const invoiceViewUrl = invoice ? buildPublicInvoiceViewUrl(invoice.public_share_id) : null;
  const client = invoice?.client ?? {};
  const poweredBy = subscriptionShowsPoweredBy(company?.subscriptionPlan ?? null);
  const status = (invoice?.status ?? 'draft') as InvoiceStatus;
  const paid = status === 'paid' || Number(invoice?.balance_amount ?? 0) <= 0;
  const paymentLabel = paid
    ? 'Paid'
    : Number(invoice?.paid_amount ?? 0) > 0
      ? 'Partially paid'
      : 'Unpaid';

  const sendInvoice = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          toEmail: client.email || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Send failed');
      notifySuccess('Invoice sent.');
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to send invoice.';
      setError(message);
      notifyError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell hideHeader title={invoice?.invoice_number ? `Invoice ${invoice.invoice_number}` : 'Invoice'}>
      <div className="ti-page-enter flex min-h-0 w-full flex-1 flex-col gap-4 md:gap-5">
        <AppPageHero
          kicker="Invoice"
          title={invoice?.invoice_number ? invoice.invoice_number : 'Invoice'}
          description={client.name ?? 'No client'}
          image="invoices"
          imageAlt="Invoice"
          compact
          actions={
            invoice ? (
              <div className="flex flex-wrap items-center gap-3">
                {allowEdit && status !== 'paid' ? (
                  <Button type="button" loading={sending} onClick={() => void sendInvoice()}>
                    Send invoice
                  </Button>
                ) : null}
                {allowEdit ? (
                  <Button asChild variant="ghost">
                    <Link href={`${routes.app.invoices}/${invoiceId}/edit`}>Edit</Link>
                  </Button>
                ) : null}
              </div>
            ) : null
          }
        />

        {error ? (
          <div className="ti-error" role="alert">
            <div className="font-medium">Couldn&apos;t load this invoice</div>
            <p className="ti-error-body">{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)]" aria-busy>
            <div className="space-y-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        ) : invoice ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)] lg:items-start">
            <div className="min-w-0">
              {draft ? (
                <InvoicePreview
                  companyName={company?.companyName ?? 'TimelyInvoices'}
                  companyLogoPath={company?.logoUrl ?? null}
                  companyDetails={mapCompanyProfileToPreviewDetails(company)}
                  draft={draft}
                  client={{
                    name: String(client.name ?? '—'),
                    email: client.email ?? null,
                    phone: client.phone ?? null,
                    address: client.address ?? null,
                    companyName: client.company_name ?? client.companyName ?? null,
                    website: client.website ?? null,
                    companyRegistration: client.company_registration ?? client.companyRegistration ?? null,
                    vatNumber: client.vat_number ?? client.vatNumber ?? null,
                  }}
                  showPoweredBy={poweredBy}
                  invoiceViewUrl={invoiceViewUrl}
                />
              ) : null}
            </div>

            <aside className="min-w-0 space-y-8 lg:sticky lg:top-6 lg:border-l lg:border-border lg:pl-8">
              <div>
                <p className="ti-meta">Invoice status</p>
                <div key={status} className="ti-status-enter mt-3">
                  <StatusBadge status={status} />
                </div>
              </div>

              <div>
                <p className="ti-meta">Client</p>
                <p className="mt-2 text-[15px] font-medium tracking-tight text-[var(--tl-ink)]">
                  {client.name ?? '—'}
                </p>
                {client.email ? <p className="ti-small mt-1">{client.email}</p> : null}
              </div>

              <div>
                <p className="ti-meta">Total due</p>
                <Amount display className="mt-2 block">
                  {formatMoney(invoice.balance_amount, invoice.currency)}
                </Amount>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--tl-ink-3)]">Invoice total</dt>
                    <dd className="ti-amount">{formatMoney(invoice.total_amount, invoice.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--tl-ink-3)]">Paid</dt>
                    <dd className="ti-amount">{formatMoney(invoice.paid_amount, invoice.currency)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <p className="ti-meta">Payment status</p>
                <p className="mt-2 text-[15px] font-medium text-[var(--tl-ink)]">{paymentLabel}</p>
                <p className="ti-small mt-1">
                  Issued {invoice.issue_date || '—'}
                  {invoice.due_date ? ` · due ${invoice.due_date}` : ''}
                </p>
                <div className="mt-5 flex flex-col items-start gap-3">
                  <Link
                    href={`${routes.app.invoices}/${invoiceId}/payments`}
                    className="text-sm font-medium text-[var(--tl-ink)] hover:underline"
                  >
                    Record payment
                  </Link>
                  {allowEdit ? (
                    <Link href="#reminder" className="text-sm font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]">
                      Send reminder
                    </Link>
                  ) : null}
                  <Link
                    href={`${routes.app.invoices}/${invoiceId}/print`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
                  >
                    Download PDF
                  </Link>
                </div>
                <div className="mt-6">
                  {allowPaymentActions ? (
                    <PayNowButton
                      invoiceId={invoiceId}
                      disabled={!(Number(invoice.balance_amount ?? 0) > 0) || invoice.status === 'paid'}
                    />
                  ) : (
                    <p className="ti-caption">Payment links are hidden for read-only users.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="ti-meta">Activity</p>
                <ol className="mt-4 space-y-4">
                  {timeline.length === 0 ? (
                    <li className="ti-small">No activity yet.</li>
                  ) : (
                    timeline.map((ev, idx) => (
                      <li key={`${ev.type}-${ev.at}-${idx}`}>
                        <p className="text-sm font-medium text-[var(--tl-ink)]">
                          {TIMELINE_LABELS[ev.type] ?? ev.type}
                        </p>
                        <time className="ti-caption mt-0.5 block tabular-nums">
                          {new Date(ev.at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: ev.type === 'created' || ev.type === 'sent' ? 'short' : undefined,
                          })}
                        </time>
                      </li>
                    ))
                  )}
                </ol>
              </div>

              <div id="reminder" className="scroll-mt-24 border-t border-border pt-6">
                <p className="ti-meta">Reminder</p>
                {allowEdit ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    loading={reminderLoading}
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
                      } catch (e: unknown) {
                        setError(e instanceof Error ? e.message : 'Failed to get reminder suggestion.');
                      } finally {
                        setReminderLoading(false);
                      }
                    }}
                  >
                    Suggest reminder
                  </Button>
                ) : (
                  <p className="ti-caption mt-2">Read-only: reminders cannot be sent.</p>
                )}

                {reminder && allowEdit ? (
                  <div className="mt-4 space-y-3">
                    <p className="ti-caption">
                      {reminder.channel.toUpperCase()} · {reminder.sendAt}
                    </p>
                    <p className="text-sm leading-relaxed text-[var(--tl-ink-2)]">{reminder.message}</p>
                    <Button
                      type="button"
                      loading={reminderSending}
                      onClick={async () => {
                        setReminderSending(true);
                        try {
                          const res = await fetch('/api/reminders/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              channel: reminder.channel,
                              toEmail: client.email ?? null,
                              toWhatsapp: client.phone ?? null,
                              message: reminder.message,
                              invoiceId,
                            }),
                          });
                          const json = await res.json();
                          if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Send failed');
                          notifySuccess('Reminder sent.');
                          await load();
                        } catch (e: unknown) {
                          const message = e instanceof Error ? e.message : 'Failed to send reminder.';
                          setError(message);
                          notifyError(message);
                        } finally {
                          setReminderSending(false);
                        }
                      }}
                    >
                      Send now
                    </Button>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
