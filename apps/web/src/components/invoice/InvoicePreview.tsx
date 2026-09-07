'use client';

import { companyLogoImgSrc } from '@/lib/company/logoUrl';
import { formatMoney } from '@/lib/format/money';
import type { InvoiceComposerDraft } from '@/components/invoice/composer/types';
import { getTimelyInvoicesMarketingUrl } from '@/lib/invoice/platformUrls';
import { getInvoiceTemplate } from '@/lib/invoices/templates';
import { cn } from '@/lib/utils/cn';
import {
  hasBankingDetails,
  type InvoicePreviewCompanyDetails,
} from '@/features/company/previewDetails';
import { BankingDetailsSection, type InvoicePreviewClient } from '@/components/invoice/preview/shared';
import { ReferencePreviewLayout } from '@/components/invoice/preview/ReferenceLayouts';
import { InvoiceQrFooter, getQrVariantForTemplate } from '@/components/invoice/InvoiceQrFooter';

export function InvoicePreview({
  companyName = 'TimelyInvoices',
  companyLogoPath,
  companyDetails,
  draft,
  client,
  showPoweredBy = false,
  invoiceViewUrl = null,
  documentKind = 'invoice',
}: {
  companyName?: string;
  companyLogoPath?: string | null;
  companyDetails?: InvoicePreviewCompanyDetails | null;
  draft: InvoiceComposerDraft;
  client: InvoicePreviewClient;
  showPoweredBy?: boolean;
  invoiceViewUrl?: string | null;
  documentKind?: 'invoice' | 'quote';
}) {
  const isQuote = documentKind === 'quote';
  const docLabel = isQuote ? 'Quote' : 'Invoice';
  const docLabelUpper = isQuote ? 'QUOTE' : 'INVOICE';
  const dueLabel = isQuote ? 'Valid until' : 'Due';
  const dueLabelLong = isQuote ? 'Valid until' : 'Due Date';
  const marketingUrl = getTimelyInvoicesMarketingUrl();
  const trimmedView = invoiceViewUrl?.trim() ?? '';
  const qrTargetUrl = trimmedView.length > 0 ? trimmedView : marketingUrl;
  const qrHeadline =
    trimmedView.length > 0
      ? isQuote
        ? 'Scan to open this quote on TimelyInvoices (view or save as PDF).'
        : 'Scan to open this invoice on TimelyInvoices (view, pay, or save as PDF).'
      : 'Scan to open TimelyInvoices — run your invoicing online and export PDFs anytime.';

  const subtotal = draft.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vat = draft.items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate / 100), 0);
  const total = subtotal + vat;

  const preset = getInvoiceTemplate(draft.template);
  const chrome = preset.chrome;
  const layout = chrome.layout ?? 'standard';

  const invoiceNo = draft.invoiceNumber ? String(draft.invoiceNumber) : '—';
  const logoSrc = companyLogoPath ? companyLogoImgSrc(companyLogoPath) : null;
  const showBanking = hasBankingDetails(companyDetails);

  const layoutProps = {
    companyName,
    companyLogoPath,
    companyDetails,
    draft,
    client,
    showPoweredBy,
    invoiceViewUrl,
    documentKind,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    isQuote,
    docLabel,
    docLabelUpper,
    dueLabel,
    dueLabelLong,
    qrTargetUrl,
    qrHeadline,
    accentHex: preset.accentHex,
    templateLayout: layout,
  };

  if (layout !== 'standard') {
    return <ReferencePreviewLayout {...layoutProps} layout={layout} />;
  }

  const isCorporate = preset.id === 'corporate';
  const onDarkHeader = /text-white|text-\[#f6f4f0\]|text-\[#fdf6ef\]/.test(chrome.header);

  return (
    <div className={cn('text-[var(--tl-ink)]', chrome.page, chrome.serif && 'font-serif')}>
      {chrome.leftRail ? <div className={chrome.leftRail} aria-hidden /> : null}
      <div className={cn(chrome.header, chrome.leftRail && 'pl-4')}>
        <div className="p-6">
          {chrome.letterhead ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="Company logo" className="h-12 w-32 object-contain" />
                ) : (
                  <div className="text-base font-semibold tracking-wide">{companyName}</div>
                )}
              </div>
              <div className={cn('mt-3', chrome.invoiceTitle)}>{docLabel}</div>
              <div className={cn('mt-2 text-xs', chrome.headerMuted)}>
                No. {invoiceNo} · Issued {draft.issueDate} · {dueLabel} {draft.dueDate}
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt="Company logo" className="h-12 w-32 object-contain" />
                  ) : null}
                  {!logoSrc ? <div className="text-sm font-semibold">{companyName}</div> : null}
                </div>
                {!isCorporate ? (
                  <div className={cn('mt-1 text-xs', chrome.headerMuted)}>
                    {isQuote ? 'Professional quote' : 'Professional invoice'}
                  </div>
                ) : null}
              </div>

              {isCorporate ? (
                <div className="text-right">
                  <div className="inline-flex items-center justify-center rounded-xl bg-[var(--ti-brand,#1A3A4A)] px-8 py-3 text-xl font-semibold tracking-wide text-white">
                    {docLabelUpper}
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-zinc-600">
                    <div>
                      <span className="font-semibold text-zinc-700">{docLabelUpper} NO.:</span> {invoiceNo}
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-700">{docLabel} Date:</span> {draft.issueDate}
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-700">{dueLabelLong}:</span> {draft.dueDate}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className={chrome.invoiceTitle}>{docLabelUpper}</div>
                  <div className={cn('mt-1 text-xs', chrome.headerMuted)}>
                    <span>
                      No: <span className={onDarkHeader ? 'text-white' : 'text-zinc-900'}>{invoiceNo}</span>
                    </span>
                    <span className="mx-2">·</span>
                    Issue: {draft.issueDate} · {dueLabel}: {draft.dueDate}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={cn('p-6', chrome.leftRail && 'pl-8')}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-zinc-600">
              {isCorporate ? `${docLabel} To:` : isQuote ? 'Quote to' : 'Bill to'}
            </div>
            <div className={isCorporate ? 'mt-3 rounded-xl bg-zinc-50 p-4' : ''}>
              {client.companyName ? (
                <>
                  <div className="text-sm font-semibold">{client.companyName}</div>
                  <div className="mt-1 text-xs font-medium text-zinc-700">{client.name}</div>
                </>
              ) : (
                <div className="text-sm font-semibold">{client.name}</div>
              )}
              <div className="mt-2 space-y-1 text-xs text-zinc-600">
                {client.phone ? <div>P: {client.phone}</div> : null}
                {client.email ? <div>E: {client.email}</div> : null}
                {client.website ? (
                  <div>
                    W: <span className="break-all">{client.website.replace(/^https?:\/\//i, '')}</span>
                  </div>
                ) : null}
                {client.companyRegistration ? <div>Reg: {client.companyRegistration}</div> : null}
                {client.vatNumber ? <div>VAT: {client.vatNumber}</div> : null}
                {client.address ? <div className="whitespace-pre-wrap">{client.address}</div> : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-zinc-600">Currency</div>
            <div className="mt-1 text-sm font-semibold">{draft.currency}</div>
            {companyDetails?.vatNumber ? <div className="mt-2 text-xs text-zinc-600">VAT: {companyDetails.vatNumber}</div> : null}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className={cn('text-xs', chrome.tableHead)}>
              <tr>
                <th className={cn('px-4 py-3 text-left font-semibold', isCorporate && 'bg-blue-600')}>Item description</th>
                <th className={cn('px-4 py-3 text-right font-semibold', isCorporate && 'bg-blue-600')}>Quantity</th>
                <th className={cn('px-4 py-3 text-right font-semibold', isCorporate && 'bg-blue-600')}>Unit Price</th>
                <th className={cn('px-4 py-3 text-right font-semibold', isCorporate && 'bg-blue-600')}>VAT</th>
                <th
                  className={cn(
                    'px-4 py-3 text-right font-semibold',
                    chrome.tableHeadLast ?? (isCorporate ? 'bg-fuchsia-600' : '')
                  )}
                >
                  Total Price
                </th>
              </tr>
            </thead>
            <tbody>
              {draft.items.map((it) => {
                const line = it.quantity * it.unitPrice;
                const lineVat = line * (it.vatRate / 100);
                return (
                  <tr key={it.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3 font-medium">{it.description || '—'}</td>
                    <td className="px-4 py-3 text-right">{it.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(it.unitPrice, draft.currency)}</td>
                    <td className="px-4 py-3 text-right">{it.vatRate}%</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(line + lineVat, draft.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isCorporate ? (
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm rounded-xl bg-blue-600 p-5 text-white">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white/90">Sub Total:</span>
                  <span className="font-semibold">{formatMoney(subtotal, draft.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white/90">Vat:</span>
                  <span className="font-semibold">{formatMoney(vat, draft.currency)}</span>
                </div>
                <div className="h-px bg-white/25" />
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold">Grand Total:</span>
                  <span className="font-semibold">{formatMoney(total, draft.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className={chrome.totalsMuted}>Subtotal</span>
                <span className={cn('font-semibold', chrome.totals)}>{formatMoney(subtotal, draft.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={chrome.totalsMuted}>VAT</span>
                <span className={cn('font-semibold', chrome.totals)}>{formatMoney(vat, draft.currency)}</span>
              </div>
              <div className="h-px bg-zinc-200" />
              <div className="flex items-center justify-between text-base">
                <span className={cn('font-semibold', chrome.totals)}>Total</span>
                <span className={cn('font-semibold', chrome.totals)}>{formatMoney(total, draft.currency)}</span>
              </div>
            </div>
          </div>
        )}

        {draft.notes?.trim() ? (
          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="text-xs font-semibold text-zinc-600">Notes</div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{draft.notes.trim()}</p>
          </div>
        ) : null}

        {showBanking && companyDetails ? (
          <BankingDetailsSection companyDetails={companyDetails} variant={isCorporate ? 'corporate' : 'cards'} />
        ) : null}

        {isCorporate ? (
          <div className="mt-10">
            <div className="text-center text-sm font-semibold text-zinc-700">Thanks for your business!</div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-zinc-600">
              {companyDetails?.phone ? <div>{companyDetails.phone}</div> : null}
              {companyDetails?.email ? <div>{companyDetails.email}</div> : null}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="h-1 rounded-full bg-blue-600" />
              <div className="h-1 rounded-full bg-blue-500" />
              <div className="h-1 rounded-full bg-fuchsia-600" />
            </div>
          </div>
        ) : null}

        <div className="px-6 pb-6">
          <InvoiceQrFooter
            qrTargetUrl={qrTargetUrl}
            headline={qrHeadline}
            variant={getQrVariantForTemplate('standard')}
            accentColor={preset.accentHex}
          />
        </div>

        {showPoweredBy ? (
          <div className="border-t border-zinc-100 px-6 py-4 text-center text-[11px] font-medium tracking-wide text-zinc-400 print:text-zinc-500">
            Powered by <span className="text-zinc-600">TimelyInvoices</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
