'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AppPageHero } from '@/components/layout/AppPageHero';
import { Amount } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';
import { formatMoney } from '@/lib/format/money';
import { convertQuoteOnServer, ensureQuoteShareLink, fetchQuoteDetail } from '@/features/quotes/api';
import type { QuoteDetail } from '@/features/quotes/types';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import type { InvoiceComposerDraft } from '@/components/invoice/composer/types';
import { fetchMyCompanyProfile, subscriptionShowsPoweredBy } from '@/features/company/api';
import { mapCompanyProfileToPreviewDetails } from '@/features/company/previewDetails';
import type { CompanyProfile } from '@/features/company/types';
import { notifyError, notifySuccess } from '@/lib/notify';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { cn } from '@/lib/utils/cn';

function quoteToPreviewDraft(quote: QuoteDetail): InvoiceComposerDraft {
  return {
    invoiceNumber: quote.quoteNumber,
    clientId: quote.clientId,
    issueDate: quote.issueDate,
    dueDate: quote.validUntil,
    currency: quote.currency,
    template: 'modern',
    notes: quote.notes ?? undefined,
    items: quote.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      vatRate: it.vatRate,
    })),
  };
}

function quoteStatusClass(status: string) {
  if (status === 'accepted' || status === 'converted') return 'ti-status-paid';
  if (status === 'declined') return 'ti-status-overdue';
  if (status === 'draft') return 'ti-status-draft';
  return 'ti-status-sent';
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as { id?: string }).id);
  const { canEdit, status: capStatus } = useWorkspaceCapabilities();
  const allowEdit = capStatus === 'ready' && canEdit;

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [q, co] = await Promise.all([fetchQuoteDetail(id), fetchMyCompanyProfile()]);
        if (!alive) return;
        setQuote(q);
        setCompany(co);
        if (q?.publicShareId && typeof window !== 'undefined') {
          setShareUrl(`${window.location.origin}/quote/${q.publicShareId}`);
        }
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load quote.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const draft = useMemo(() => (quote ? quoteToPreviewDraft(quote) : null), [quote]);
  const poweredBy = subscriptionShowsPoweredBy(company?.subscriptionPlan);

  return (
    <AppShell hideHeader title={quote?.quoteNumber ? `Quote ${quote.quoteNumber}` : 'Quote'}>
      <div className="ti-page-enter flex min-h-0 w-full flex-1 flex-col gap-4 md:gap-5">
        <AppPageHero
          kicker="Quote"
          title={quote?.quoteNumber ? quote.quoteNumber : 'Quote'}
          description={quote?.clientName ?? 'No client'}
          image="quotes"
          imageAlt="Quote"
          compact
          actions={
            quote ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="ghost">
                  <Link href={routes.app.quotes}>Back</Link>
                </Button>
                {quote.status !== 'converted' && allowEdit ? (
                  <>
                    <Button
                      variant="secondary"
                      loading={sharing}
                      onClick={async () => {
                        setSharing(true);
                        setError(null);
                        try {
                          const { shareUrl: url } = await ensureQuoteShareLink(id);
                          setShareUrl(url);
                          await navigator.clipboard.writeText(url);
                          notifySuccess('Share link copied.');
                          const refreshed = await fetchQuoteDetail(id);
                          setQuote(refreshed);
                        } catch (e: unknown) {
                          const msg = e instanceof Error ? e.message : 'Could not create share link.';
                          setError(msg);
                          notifyError(msg);
                        } finally {
                          setSharing(false);
                        }
                      }}
                    >
                      {shareUrl ? 'Copy share link' : 'Share quote'}
                    </Button>
                    <Button
                      loading={converting}
                      onClick={async () => {
                        setConverting(true);
                        setError(null);
                        try {
                          const { invoiceId } = await convertQuoteOnServer(id);
                          notifySuccess('Converted to invoice.');
                          router.push(`${routes.app.invoices}/${invoiceId}`);
                        } catch (e: unknown) {
                          const msg = e instanceof Error ? e.message : 'Convert failed.';
                          setError(msg);
                          notifyError(msg);
                        } finally {
                          setConverting(false);
                        }
                      }}
                    >
                      Convert to invoice
                    </Button>
                  </>
                ) : quote.convertedInvoiceId ? (
                  <Button asChild variant="secondary">
                    <Link href={`${routes.app.invoices}/${quote.convertedInvoiceId}`}>Open invoice</Link>
                  </Button>
                ) : null}
              </div>
            ) : null
          }
        />

        {error ? (
          <div className="ti-error" role="alert">
            <div className="font-medium">Couldn&apos;t load this quote</div>
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
        ) : quote ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)] lg:items-start">
            <div className="min-w-0">
              {draft ? (
                <InvoicePreview
                  documentKind="quote"
                  companyName={company?.companyName ?? 'TimelyInvoices'}
                  companyLogoPath={company?.logoUrl ?? null}
                  companyDetails={mapCompanyProfileToPreviewDetails(company)}
                  draft={draft}
                  client={{
                    name: quote.clientName ?? '—',
                    email: quote.clientEmail,
                    phone: quote.clientPhone,
                    address: quote.clientAddress,
                    companyName: quote.clientCompanyName,
                  }}
                  showPoweredBy={poweredBy}
                  invoiceViewUrl={shareUrl}
                />
              ) : null}
            </div>

            <aside className="min-w-0 space-y-8 lg:sticky lg:top-6 lg:border-l lg:border-border lg:pl-8">
              <div>
                <p className="ti-meta">Quote status</p>
                <div className="ti-status-enter mt-3">
                  <span className={cn('ti-status capitalize', quoteStatusClass(quote.status))}>{quote.status}</span>
                </div>
              </div>

              <div>
                <p className="ti-meta">Client</p>
                <p className="mt-2 text-[15px] font-medium tracking-tight text-[var(--tl-ink)]">
                  {quote.clientName ?? '—'}
                </p>
                {quote.clientEmail ? <p className="ti-small mt-1">{quote.clientEmail}</p> : null}
              </div>

              <div>
                <p className="ti-meta">Quote total</p>
                <Amount display className="mt-2 block">
                  {formatMoney(quote.totalAmount, quote.currency)}
                </Amount>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--tl-ink-3)]">Subtotal</dt>
                    <dd className="ti-amount">{formatMoney(quote.subtotalAmount, quote.currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--tl-ink-3)]">Tax</dt>
                    <dd className="ti-amount">{formatMoney(quote.taxAmount, quote.currency)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <p className="ti-meta">Validity</p>
                <p className="mt-2 text-[15px] font-medium text-[var(--tl-ink)]">
                  Issued {quote.issueDate || '—'}
                </p>
                <p className="ti-small mt-1">Valid until {quote.validUntil || '—'}</p>
                {quote.acceptedAt ? (
                  <p className="ti-small mt-1 text-[var(--tl-success)]">Accepted {quote.acceptedAt.slice(0, 10)}</p>
                ) : null}
                {quote.declinedAt ? (
                  <p className="ti-small mt-1 text-[var(--tl-danger)]">Declined {quote.declinedAt.slice(0, 10)}</p>
                ) : null}
                <Link
                  href={`${routes.app.quotes}/${quote.id}/print`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--tl-ink-2)] hover:text-[var(--tl-ink)]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download PDF
                </Link>
              </div>

              {shareUrl ? (
                <div>
                  <p className="ti-meta">Public link</p>
                  <p className="ti-caption mt-2 break-all text-[var(--tl-ink-3)]">{shareUrl}</p>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
