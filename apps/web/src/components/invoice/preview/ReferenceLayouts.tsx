'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/format/money';
import {
  BankingDetailsSection,
  ClientBlock,
  formatLineTotal,
  PreviewFooter,
  PreviewLineGrid,
  PreviewTable,
  PreviewTotalsStack,
  type InvoicePreviewLayoutProps,
} from '@/components/invoice/preview/shared';
import { InvoiceQrFooter } from '@/components/invoice/InvoiceQrFooter';

const MANBLUE_NAVY = '#2E3192';
const MANBLUE_LIME = '#C5D97A';
const NEXUS_GOLD = '#C9A961';
const TECHNO_GOLD = '#D1B98B';
const TECHNO_DARK = '#2E2E2E';
const OPTIONS_CYAN = '#17A2C6';
const PRESENT_GOLD = '#F5A623';

/** Manblue — navy + lime, pill shapes, split table header */
export function ManbluePreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabelUpper,
    isQuote,
  } = props;

  return (
    <div className="bg-[#E8E8E8] text-zinc-900" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="ref-pad">
        <div className="ref-header-row">
          <div className="flex min-w-0 items-center gap-2">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-9 w-9 shrink-0 rounded-full object-contain" />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: MANBLUE_NAVY }}
              >
                {companyName.charAt(0)}
              </div>
            )}
            <span className="min-w-0 break-words text-sm font-bold">{companyName}</span>
          </div>
          <div
            className="min-w-0 max-w-full rounded-bl-xl rounded-br-xl px-3 py-2 text-right text-[10px] text-white sm:max-w-[48%]"
            style={{ backgroundColor: MANBLUE_NAVY }}
          >
            <div className="break-words">
              <span className="font-semibold">{isQuote ? 'Quote' : 'Invoice'} Date:</span> {draft.issueDate}
            </div>
            <div className="mt-0.5 break-words">
              <span className="font-semibold">{isQuote ? 'Quote' : 'Invoice'} No:</span> {invoiceNo}
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-w-0 items-center gap-2">
          <h1 className="ref-title-xl">{docLabelUpper}</h1>
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-900 text-xs"
            style={{ color: MANBLUE_LIME }}
          >
            ✦
          </span>
        </div>

        <div className="ref-two-col mt-6">
          <ClientBlock client={client} label={`${isQuote ? 'Quote' : 'Invoice'} to:`} />
          <div className="min-w-0 text-right">
            <div className="text-[11px] font-medium text-zinc-600">Grand Total :</div>
            <div
              className="ref-pill-total mt-1 inline-block max-w-full whitespace-normal rounded-full px-3 py-1.5 text-sm font-bold tabular-nums text-white"
              style={{ backgroundColor: MANBLUE_NAVY }}
            >
              {formatMoney(total, draft.currency)}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <PreviewLineGrid
            items={draft.items}
            currency={draft.currency}
            variant="4col"
            headerStyle={{ backgroundColor: MANBLUE_NAVY, color: '#fff' }}
            labels={{ desc: 'Item', qty: 'Qty', price: 'Price', total: 'Total' }}
            zebra
          />

          <div>
            <PreviewTotalsStack
              rows={[
                { label: 'Subtotal:', value: formatMoney(subtotal, draft.currency) },
                { label: 'Tax:', value: formatMoney(vat, draft.currency) },
              ]}
            />
          </div>
          <div className="rounded-full">
            <div className="flex flex-wrap text-[11px] font-bold text-white">
              <div className="min-w-0 flex-1 px-3 py-2 uppercase" style={{ backgroundColor: MANBLUE_NAVY }}>
                Total
              </div>
              <div
                className="whitespace-normal px-3 py-2 tabular-nums"
                style={{ backgroundColor: MANBLUE_LIME, color: MANBLUE_NAVY }}
              >
                {formatMoney(total, draft.currency)}
              </div>
            </div>
          </div>

          {(showBanking && companyDetails) || draft.notes?.trim() ? (
            <div className="ref-two-col gap-4 border-t border-zinc-300/60 pt-4">
              {showBanking && companyDetails ? (
                <div className="min-w-0">
                  <BankingDetailsSection companyDetails={companyDetails} variant="timeline" />
                </div>
              ) : (
                <div />
              )}
              {draft.notes?.trim() ? (
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase">Terms &amp; Condition</div>
                  <p className="mt-1 break-words text-[9px] leading-relaxed text-zinc-600">{draft.notes.trim()}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="ref-header-row mt-8">
          <div className="ref-title-lg font-black">Thank You.</div>
          <div className="flex min-w-0 flex-col gap-1.5">
            {companyDetails?.phone ? (
              <div
                className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold"
                style={{ backgroundColor: MANBLUE_LIME, color: MANBLUE_NAVY }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[9px]">☎</span>
                <span className="min-w-0 break-all">{companyDetails.phone}</span>
              </div>
            ) : null}
            {companyDetails?.email ? (
              <div
                className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: MANBLUE_NAVY }}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[9px]">✉</span>
                <span className="min-w-0 break-all">{companyDetails.email}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

/** Nexus Construction — gold accent, thin INVOICE, gold table header */
export function NexusPreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabelUpper,
    dueLabelLong,
    isQuote,
  } = props;

  return (
    <div className="border-4 border-zinc-700 bg-white text-zinc-800">
      <div className="ref-pad">
        <div className="ref-header-row">
          <div className="flex min-w-0 items-center gap-2">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-10 w-10 shrink-0 object-contain" />
            ) : (
              <div className="grid h-10 w-10 shrink-0 grid-cols-3 gap-0.5 p-0.5" style={{ color: NEXUS_GOLD }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-full border border-current" />
                ))}
              </div>
            )}
            <div className="min-w-0 text-[11px] font-bold uppercase tracking-wide text-zinc-700">{companyName}</div>
          </div>
          <div className="min-w-0 text-right text-[10px] text-zinc-600">
            <div className="font-semibold uppercase">Office address</div>
            {companyDetails?.address ? <div className="mt-0.5">{companyDetails.address}</div> : null}
            {companyDetails?.phone ? <div className="mt-0.5">{companyDetails.phone}</div> : null}
            {companyDetails?.website ? <div className="truncate">{companyDetails.website.replace(/^https?:\/\//i, '')}</div> : null}
          </div>
        </div>

        <div className="ref-two-col mt-6">
          <div className="min-w-0">
            <h1 className="ref-title-lg font-extralight uppercase ref-tracking-title text-zinc-800">{docLabelUpper}</h1>
            <div className="mt-4 space-y-1.5 text-[10px]">
              {[
                [`${isQuote ? 'Quote' : 'Invoice'} No:`, invoiceNo],
                [`${isQuote ? 'Quote' : 'Invoice'} Date:`, draft.issueDate],
                [dueLabelLong + ':', draft.dueDate],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2 border-b border-zinc-200 pb-1.5">
                  <span className="font-semibold">{label}</span>
                  <span className="min-w-0 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[11px] text-zinc-500">Total Due:</div>
            <div className="ref-title-lg font-bold" style={{ color: NEXUS_GOLD }}>
              {formatMoney(total, draft.currency)}
            </div>
            <div className="mt-4 text-left">
              <div className="text-[10px] font-semibold text-zinc-500">Bill To:</div>
              <div className="mt-1 text-[11px] font-bold">{client.name}</div>
              {client.address ? <div className="mt-0.5 text-[10px] text-zinc-600">{client.address}</div> : null}
              {client.phone ? <div className="text-[10px] text-zinc-600">P: {client.phone}</div> : null}
            </div>
          </div>
        </div>

        <PreviewTable className="mt-6">
          <thead>
            <tr className="text-[9px] uppercase text-white" style={{ backgroundColor: NEXUS_GOLD }}>
              <th className="w-[8%] font-semibold">No.</th>
              <th className="font-semibold">Item</th>
              <th className="ref-num w-[18%] font-semibold">Price</th>
              <th className="ref-qty w-[10%] font-semibold">Qty</th>
              <th className="ref-num w-[20%] font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {draft.items.map((it, idx) => (
              <tr key={it.id} className="border-b border-zinc-200">
                <td className="text-zinc-500">{String(idx + 1).padStart(2, '0')}</td>
                <td className="font-bold">{it.description || '—'}</td>
                <td className="ref-num">{formatMoney(it.unitPrice, draft.currency)}</td>
                <td className="ref-qty">{it.quantity}</td>
                <td className="ref-num font-semibold">
                  {formatLineTotal(it.quantity, it.unitPrice, it.vatRate, draft.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </PreviewTable>

        <div className="mt-4 flex justify-end">
          <PreviewTotalsStack
            className="w-full max-w-[11rem]"
            rows={[
              { label: 'Sub-Total:', value: formatMoney(subtotal, draft.currency) },
              { label: 'VAT:', value: formatMoney(vat, draft.currency) },
              { label: 'Grand Total:', value: formatMoney(total, draft.currency), emphasis: true },
            ]}
          />
        </div>

        <div className="ref-two-col mt-8">
          <div className="min-w-0">
            {showBanking && companyDetails ? (
              <BankingDetailsSection companyDetails={companyDetails} variant="inline" />
            ) : null}
            <p className="mt-4 text-sm italic" style={{ color: NEXUS_GOLD, fontFamily: 'Georgia, serif' }}>
              Thank you for your business!
            </p>
            {draft.notes?.trim() ? (
              <div className="mt-3">
                <div className="text-[10px] font-semibold">Terms &amp; Conditions:</div>
                <p className="mt-1 text-[9px] text-zinc-600">{draft.notes.trim()}</p>
              </div>
            ) : null}
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[11px] font-semibold text-zinc-700">{companyName}</div>
            <div className="mt-4 text-lg italic text-zinc-300" style={{ fontFamily: 'cursive' }}>
              {companyName.split(' ')[0]}
            </div>
          </div>
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

/** Technosoft — gold blocks, dark header bar, gold description column */
export function TechnosoftPreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabelUpper,
    isQuote,
  } = props;

  return (
    <div className="bg-white text-zinc-800">
      <div className="flex min-w-0 flex-wrap">
        <div className="hidden h-2 w-8 shrink-0 sm:block" style={{ backgroundColor: TECHNO_GOLD }} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="ref-header-row px-3 py-3 text-white sm:px-4" style={{ backgroundColor: TECHNO_DARK }}>
            <div className="min-w-0">
              <div className="ref-title-md uppercase">{docLabelUpper}</div>
              <div className="mt-0.5 text-[10px]">
                {isQuote ? 'Quote' : 'Invoice'} No: {invoiceNo}
              </div>
            </div>
            <div className="text-[10px] font-semibold">Date: {draft.issueDate}</div>
          </div>
          <div className="border-b border-zinc-200 px-3 py-2 text-[9px] text-zinc-600">
            {companyDetails?.phone ? <div className="truncate">☎ {companyDetails.phone}</div> : null}
            {companyDetails?.email ? <div className="truncate">✉ {companyDetails.email}</div> : null}
          </div>
        </div>
        <div className="hidden h-2 w-8 shrink-0 sm:block" style={{ backgroundColor: TECHNO_GOLD }} />
      </div>

      <div className="ref-pad">
        <div className="ref-header-row">
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-500">{isQuote ? 'Quote To' : 'Invoice To'}</div>
            <div className="mt-0.5 text-sm font-bold uppercase">{client.name}</div>
            {client.address ? <div className="mt-0.5 text-[10px]">A: {client.address}</div> : null}
            {client.phone ? <div className="text-[10px]">P: {client.phone}</div> : null}
          </div>
          <div className="flex min-w-0 items-center gap-2 text-right">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-9 w-9 shrink-0 object-contain" />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: TECHNO_GOLD, color: TECHNO_DARK }}
              >
                {companyName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase">{companyName}</div>
            </div>
          </div>
        </div>

        <PreviewTable className="mt-5">
          <thead>
            <tr className="text-[9px] uppercase text-white">
              <th className="w-[8%] font-semibold" style={{ backgroundColor: TECHNO_DARK }}>SL.</th>
              <th className="font-semibold" style={{ backgroundColor: TECHNO_GOLD, color: TECHNO_DARK }}>Description</th>
              <th className="ref-num w-[16%] font-semibold" style={{ backgroundColor: TECHNO_DARK }}>Rate</th>
              <th className="ref-qty w-[8%] font-semibold" style={{ backgroundColor: TECHNO_DARK }}>Qty</th>
              <th className="ref-num w-[18%] font-semibold" style={{ backgroundColor: TECHNO_DARK }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {draft.items.map((it, idx) => (
              <tr key={it.id} className="border-b border-zinc-200">
                <td className="text-center text-zinc-500">{String(idx + 1).padStart(2, '0')}</td>
                <td style={{ backgroundColor: `${TECHNO_GOLD}33` }}>
                  <div className="font-bold">{it.description || '—'}</div>
                </td>
                <td className="ref-num">{formatMoney(it.unitPrice, draft.currency)}</td>
                <td className="ref-qty">{it.quantity}</td>
                <td className="ref-num font-semibold">
                  {formatLineTotal(it.quantity, it.unitPrice, it.vatRate, draft.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </PreviewTable>

        <div className="ref-two-col mt-4">
          <div className="min-w-0 rounded-sm p-3" style={{ backgroundColor: `${TECHNO_GOLD}55` }}>
            <div className="text-[10px] font-semibold text-zinc-600">Total Due</div>
            <div className="ref-title-md">{formatMoney(total, draft.currency)}</div>
          </div>
          <PreviewTotalsStack
            rows={[
              { label: 'Sub Total:', value: formatMoney(subtotal, draft.currency) },
              { label: 'Tax:', value: formatMoney(vat, draft.currency) },
              { label: 'Grand Total:', value: formatMoney(total, draft.currency), emphasis: true },
            ]}
          />
        </div>

        <div className="ref-two-col mt-6">
          <div className="min-w-0">
            {showBanking && companyDetails ? (
              <BankingDetailsSection companyDetails={companyDetails} variant="inline" />
            ) : null}
            <div
              className="mt-4 border-b-2 pb-1 text-[11px] font-bold uppercase tracking-wide"
              style={{ borderColor: TECHNO_GOLD, color: TECHNO_GOLD }}
            >
              Thank you for your business!
            </div>
            {draft.notes?.trim() ? (
              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase">Terms &amp; Conditions:</div>
                <p className="mt-1 text-[9px] text-zinc-600">{draft.notes.trim()}</p>
              </div>
            ) : null}
          </div>
          <div className="min-w-0 text-right">
            <div className="text-xl italic text-zinc-300" style={{ fontFamily: 'cursive' }}>
              {client.name.split(' ')[0]}
            </div>
            <div className="mt-1 text-[11px] font-bold uppercase">{companyName}</div>
          </div>
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

/** Options Fashions — cyan accent, circular logo, cyan banner footer */
export function OptionsPreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabelUpper,
    dueLabelLong,
    isQuote,
  } = props;

  return (
    <div className="bg-white text-zinc-800">
      <div className="ref-pad">
        <div className="ref-header-row">
          <div className="min-w-0">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-[#17A2C6]/30" />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: OPTIONS_CYAN }}
              >
                {companyName.charAt(0)}
              </div>
            )}
            <div className="mt-1 text-sm font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>
              {companyName}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <h1 className="ref-title-lg uppercase">{docLabelUpper}</h1>
            <div className="mt-0.5 text-[10px] text-zinc-500">
              {isQuote ? 'Quote' : 'Invoice'} No : #{invoiceNo}
            </div>
          </div>
        </div>

        <div className="ref-two-col mt-5">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold" style={{ color: OPTIONS_CYAN }}>
              {isQuote ? 'Quote To:' : 'Invoice To:'}
            </div>
            <div className="mt-1 text-[11px] font-bold">{client.name}</div>
            {client.address ? <div className="mt-0.5 text-[10px] text-zinc-600">{client.address}</div> : null}
          </div>
          <div className="grid min-w-0 grid-cols-3 gap-1 text-center text-[9px]">
            <div>
              <div className="text-zinc-500">{isQuote ? 'Quote' : 'Invoice'} No</div>
              <div className="mt-0.5 font-bold">{invoiceNo}</div>
            </div>
            <div>
              <div className="text-zinc-500">Date</div>
              <div className="mt-0.5 font-bold">{draft.issueDate}</div>
            </div>
            <div>
              <div className="text-zinc-500">{dueLabelLong}</div>
              <div className="mt-0.5 font-bold">{draft.dueDate}</div>
            </div>
          </div>
        </div>

        <PreviewLineGrid
          items={draft.items}
          currency={draft.currency}
          variant="4col"
          headerStyle={{ backgroundColor: OPTIONS_CYAN, color: '#fff' }}
          labels={{ desc: 'Descriptions', qty: 'Qty', price: 'Price', total: 'Total' }}
          zebra
        />

        <div className="ref-two-col mt-4">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold">Due</div>
            <div className="ref-title-md">{formatMoney(total, draft.currency)}</div>
            {showBanking && companyDetails ? (
              <div className="mt-3">
                <div className="text-[11px] font-semibold" style={{ color: OPTIONS_CYAN }}>
                  Payment Method
                </div>
                <BankingDetailsSection companyDetails={companyDetails} variant="inline" />
              </div>
            ) : null}
          </div>
          <PreviewTotalsStack
            rows={[
              { label: 'Sub Total', value: formatMoney(subtotal, draft.currency) },
              { label: 'Tax (VAT)', value: formatMoney(vat, draft.currency) },
              { label: 'GRAND TOTAL', value: formatMoney(total, draft.currency), emphasis: true },
            ]}
          />
        </div>

        {draft.notes?.trim() ? (
          <div className="mt-4 text-[9px] text-zinc-600">
            <span className="font-semibold">Terms &amp; Conditions:</span> {draft.notes.trim()}
          </div>
        ) : null}
      </div>

      <div className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: OPTIONS_CYAN }}>
        Thank you for your business!
      </div>
      <div className="ref-two-col ref-pad text-[9px] text-zinc-600">
        <div className="min-w-0">
          {companyDetails?.phone ? <div className="truncate">{companyDetails.phone}</div> : null}
          {companyDetails?.email ? <div className="truncate">{companyDetails.email}</div> : null}
        </div>
        <div className="min-w-0">
          {companyDetails?.address ? (
            <>
              <div className="font-semibold">Location:</div>
              <div>{companyDetails.address}</div>
            </>
          ) : null}
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

/** Your Present — golden-orange pills, sidebar layout */
export function PresentPreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    showBanking,
    docLabelUpper,
    dueLabelLong,
    isQuote,
  } = props;

  return (
    <div className="bg-white text-zinc-900">
      <div className="ref-pad">
        <div className="ref-header-row">
          <div
            className="max-w-full truncate rounded-full px-3 py-1.5 text-[10px] font-bold uppercase"
            style={{ backgroundColor: PRESENT_GOLD }}
          >
            {companyName}
          </div>
          <div
            className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase"
            style={{ backgroundColor: PRESENT_GOLD }}
          >
            NO {invoiceNo}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <h1 className="ref-title-lg uppercase">{docLabelUpper}</h1>
        </div>
        <div className="mt-3 h-px bg-zinc-300" />

        <div className="ref-present-layout mt-5">
          <div className="ref-present-side space-y-4">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase">Bill To :</div>
              <div className="mt-1 text-sm font-bold">{client.name}</div>
              {client.address ? <div className="mt-0.5 text-[10px] text-zinc-600">{client.address}</div> : null}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase">Detail Date :</div>
              <div className="mt-1 space-y-0.5 text-[10px]">
                <div><span className="font-semibold">Date :</span> {draft.issueDate}</div>
                <div><span className="font-semibold">{dueLabelLong} :</span> {draft.dueDate}</div>
                <div><span className="font-semibold">Terms :</span> Net 30</div>
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase">Thank you for the business</div>
            <div className="min-w-0">
              <div
                className="inline-block rounded-full px-2.5 py-1 text-[9px] font-bold uppercase"
                style={{ backgroundColor: PRESENT_GOLD }}
              >
                Contact Info
              </div>
              <div className="mt-1 space-y-0.5 text-[10px] text-zinc-600">
                {companyDetails?.email ? <div className="truncate">{companyDetails.email}</div> : null}
                {companyDetails?.phone ? <div>{companyDetails.phone}</div> : null}
              </div>
            </div>
          </div>

          <div className="ref-present-main min-w-0">
            <PreviewLineGrid
              items={draft.items}
              currency={draft.currency}
              headerStyle={{ backgroundColor: PRESENT_GOLD, color: '#111' }}
              labels={{ desc: 'Service', qty: 'Qty', price: 'Price', total: 'Total' }}
            />
            <div className="mt-3">
              <PreviewTotalsStack
                className="ml-auto max-w-[10rem]"
                rows={[
                  { label: 'Sub Total', value: formatMoney(subtotal, draft.currency) },
                  { label: 'Taxes', value: formatMoney(vat, draft.currency) },
                ]}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <div
                className="ref-pill-total flex max-w-full items-center gap-3 rounded-full font-bold"
                style={{ backgroundColor: PRESENT_GOLD }}
              >
                <span>Total</span>
                <span className="ref-num">{formatMoney(total, draft.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ref-two-col mt-6 border-t border-zinc-200 pt-4">
          {draft.notes?.trim() ? (
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase">Terms &amp; Condition</div>
              <p className="mt-1 text-[9px] text-zinc-600">{draft.notes.trim()}</p>
            </div>
          ) : (
            <div />
          )}
          {showBanking && companyDetails ? (
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase">Payment Method</div>
              <BankingDetailsSection companyDetails={companyDetails} variant="inline" />
            </div>
          ) : null}
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

const TEAL = '#2E7D78';
const NAVY = '#282C3F';
const LIME = '#A4CC34';
const CORAL_NAVY = '#1A2B4C';
const CORAL = '#E85D61';
const CORAL_PINK = '#F4C2C2';
const VENTURE_GREEN = '#3D8B5F';

function formatTealFrameDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' });
  const month = d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = d.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'UTC' });
  return `${day} ${month}, ${year}`;
}

function formatWebsiteDisplay(url: string) {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function tealFrameVatLabel(items: InvoicePreviewLayoutProps['draft']['items']) {
  if (items.length === 0) return 'Tax Vat';
  const rates = [...new Set(items.map((it) => it.vatRate))];
  return rates.length === 1 ? `Tax Vat ${rates[0]}%` : 'Tax Vat';
}

function TealFrameLogoMark({ logoSrc }: { logoSrc: string | null }) {
  if (logoSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoSrc} alt="" className="h-9 w-9 shrink-0 object-contain" />
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-9 w-9 shrink-0"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 12L21 3L14 21L11 13L3 12Z"
        fill={TEAL}
        stroke={TEAL}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Teal Frame — vertical teal rails, rounded metadata pill, total bar */
export function TealFramePreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabel,
    isQuote,
  } = props;

  const docNoLabel = isQuote ? 'Quote no:' : 'Invoice no:';
  const docDateLabel = isQuote ? 'Quote Date:' : 'Invoice Date:';
  const clientLabel = isQuote ? 'Quote To:' : 'Invoice To:';
  const signatureName = companyDetails?.accountName?.trim() || companyName;

  return (
    <div className="ref-teal-frame relative bg-white text-zinc-800">
      <div className="ref-teal-rail ref-teal-rail-left" style={{ backgroundColor: TEAL }} aria-hidden />
      <div className="ref-teal-rail ref-teal-rail-right" style={{ backgroundColor: TEAL }} aria-hidden />

      <div className="ref-teal-body">
        <div className="ref-header-row items-start gap-4 pb-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <TealFrameLogoMark logoSrc={logoSrc} />
            <div className="min-w-0">
              <div className="break-words text-[11px] font-bold uppercase tracking-wide" style={{ color: TEAL }}>
                {companyName}
              </div>
            </div>
          </div>
          <div className="min-w-0 space-y-0.5 text-right text-[9px] leading-relaxed text-zinc-700">
            {companyDetails?.email ? (
              <div className="break-all">Email: {companyDetails.email}</div>
            ) : null}
            {companyDetails?.website ? (
              <div className="break-all">Website: {formatWebsiteDisplay(companyDetails.website)}</div>
            ) : null}
          </div>
        </div>

        <div className="border-b border-zinc-300" aria-hidden />

        <h1 className="ref-title-xl mt-5 font-bold" style={{ color: TEAL }}>
          {docLabel}.
        </h1>

        <div className="ref-two-col mt-6">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-800">{clientLabel}</div>
            <div className="mt-1.5 break-words text-[12px] font-bold" style={{ color: TEAL }}>
              {client.companyName || client.name}
            </div>
            <div className="mt-1.5 space-y-0.5 text-[10px] leading-relaxed text-zinc-600">
              {client.address ? <div className="whitespace-pre-wrap break-words">{client.address}</div> : null}
              {client.website ? <div className="break-all">{formatWebsiteDisplay(client.website)}</div> : null}
              {client.phone ? <div>{client.phone}</div> : null}
              {client.email ? <div>{client.email}</div> : null}
            </div>
          </div>
          <div className="flex min-w-0 justify-end">
            <div
              className="ref-teal-meta inline-block max-w-full rounded-[0.65rem] px-4 py-2.5 text-[10px] leading-relaxed text-white"
              style={{ backgroundColor: TEAL }}
            >
              <div className="break-words">
                <span className="font-semibold">{docNoLabel}</span> {invoiceNo}
              </div>
              <div className="mt-1 break-words">
                <span className="font-semibold">{docDateLabel}</span> {formatTealFrameDate(draft.issueDate)}
              </div>
            </div>
          </div>
        </div>

        <PreviewLineGrid
          items={draft.items}
          currency={draft.currency}
          variant="5col"
          headerStyle={{ backgroundColor: TEAL, color: '#fff' }}
          headerClassName="ref-teal-grid-head"
          labels={{ desc: 'Description', qty: 'Qty', price: 'Price', total: 'Total' }}
        />

        <div className="mt-3 flex justify-end">
          <PreviewTotalsStack
            className="w-full max-w-[11rem] text-[10px]"
            rows={[
              { label: 'Sub Total', value: formatMoney(subtotal, draft.currency) },
              { label: tealFrameVatLabel(draft.items), value: formatMoney(vat, draft.currency) },
            ]}
          />
        </div>

        <div
          className="ref-teal-total-bar mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[0.65rem] px-4 py-2.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: TEAL }}
        >
          <span>Total Amount</span>
          <span className="ref-num">{formatMoney(total, draft.currency)}</span>
        </div>

        <div className="ref-two-col mt-8 gap-6">
          <div className="min-w-0 space-y-4">
            {showBanking && companyDetails ? (
              <div>
                <div className="text-[10px] font-bold" style={{ color: TEAL }}>
                  Payment Method:
                </div>
                <div className="mt-1.5 space-y-0.5 text-[9px] leading-relaxed text-zinc-600">
                  {companyDetails.accountName ? <div>{companyDetails.accountName}</div> : null}
                  {companyDetails.accountNumber ? <div>Account No: {companyDetails.accountNumber}</div> : null}
                  {!companyDetails.accountName && !companyDetails.accountNumber && companyDetails.bankName ? (
                    <div>{companyDetails.bankName}</div>
                  ) : null}
                </div>
              </div>
            ) : null}
            {draft.notes?.trim() ? (
              <div>
                <div className="text-[10px] font-bold" style={{ color: TEAL }}>
                  Terms and Condition
                </div>
                <p className="mt-1.5 text-[9px] leading-relaxed text-zinc-600">{draft.notes.trim()}</p>
              </div>
            ) : null}
          </div>
          <div className="min-w-0 self-end text-right">
            <div className="ml-auto max-w-[10rem] border-t border-zinc-400 pt-1.5 text-[10px] text-zinc-600">
              Account Manager
            </div>
            <div className="mt-1 break-words text-[11px] font-bold" style={{ color: TEAL }}>
              {signatureName}
            </div>
          </div>
        </div>
      </div>

      <PreviewFooter {...props} />
    </div>
  );
}

/** Navy Lime — dark header band, lime table, totals box */
export function NavyLimePreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabelUpper,
    isQuote,
  } = props;

  return (
    <div className="bg-white text-zinc-800">
      <div className="ref-pad text-white" style={{ backgroundColor: NAVY }}>
        <div className="ref-header-row">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 items-center gap-2 px-2 py-1.5" style={{ backgroundColor: LIME }}>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="h-6 w-6 object-contain" />
              ) : (
                <span className="text-sm" style={{ color: NAVY }}>✈</span>
              )}
              <div className="min-w-0" style={{ color: NAVY }}>
                <div className="truncate text-[9px] font-black uppercase">{companyName}</div>
              </div>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-8 w-1 shrink-0" style={{ backgroundColor: LIME }} />
            <h1 className="ref-title-lg italic uppercase" style={{ color: LIME }}>{docLabelUpper}</h1>
          </div>
        </div>

        <div className="ref-two-col mt-4">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase" style={{ color: LIME }}>
              {isQuote ? 'Quote To' : 'Invoice To'}
            </div>
            <div className="mt-1 text-sm font-bold">{client.companyName || client.name}</div>
            <div className="mt-2 space-y-1 border-t border-white/20 pt-2 text-[10px] text-white/90">
              {client.address ? <div>{client.address}</div> : null}
              {client.phone ? <div>{client.phone}</div> : null}
            </div>
          </div>
          <div className="min-w-0 space-y-1.5 text-[10px]">
            {[
              [isQuote ? 'Quote No' : 'Invoice No', invoiceNo],
              ['Account No', companyDetails?.accountNumber ?? '—'],
              [isQuote ? 'Quote Date' : 'Invoice Date', draft.issueDate],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2 border-b border-white/20 pb-1">
                <span style={{ color: LIME }}>{label}</span>
                <span className="ref-num min-w-0 text-right">: {value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ref-pad">
        <PreviewLineGrid
          items={draft.items}
          currency={draft.currency}
          variant="5col"
          headerStyle={{ backgroundColor: LIME, color: NAVY }}
          labels={{ desc: 'Item', qty: 'Qty', price: 'Price', total: 'Total' }}
          zebra
        />

        <div className="ref-two-col mt-4">
          <div className="min-w-0">
            <div className="text-lg italic text-zinc-300" style={{ fontFamily: 'cursive' }}>
              {companyName.split(' ')[0]}
            </div>
            <div className="mt-1 h-0.5 w-24" style={{ backgroundColor: LIME }} />
            <div className="mt-1 text-[10px] text-zinc-600">Account Manager</div>
            <div className="text-[11px] font-bold">{companyName}</div>
          </div>
          <div className="min-w-0 px-3 py-2 text-[10px] text-white" style={{ backgroundColor: NAVY }}>
            {[
              ['Sub Total', formatMoney(subtotal, draft.currency)],
              ['Tax Vat', formatMoney(vat, draft.currency)],
              ['Total Due', formatMoney(total, draft.currency)],
            ].map(([label, value], i) => (
              <div
                key={label}
                className={cn('flex justify-between gap-2 border-b border-white/20 py-1.5', i === 2 && 'border-0 font-bold')}
                style={i === 2 ? { color: LIME } : undefined}
              >
                <span>{label}</span>
                <span className="ref-num">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ref-two-col mt-4">
          <div className="grid min-w-0 grid-cols-2 gap-2">
            {[
              ['🌐', companyDetails?.website],
              ['✉', companyDetails?.email],
              ['☎', companyDetails?.phone],
              ['📍', companyDetails?.address],
            ].map(([icon, val]) =>
              val ? (
                <div key={String(icon)} className="flex min-w-0 items-start gap-1.5 text-[9px]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center" style={{ backgroundColor: LIME, color: NAVY }}>
                    {icon}
                  </span>
                  <span className="min-w-0 break-words text-zinc-600">{String(val)}</span>
                </div>
              ) : null
            )}
          </div>
          {draft.notes?.trim() ? (
            <div className="min-w-0 px-2 py-2 text-[9px] text-white/90" style={{ backgroundColor: NAVY }}>
              <div className="font-bold uppercase" style={{ color: LIME }}>| Terms and Condition</div>
              <p className="mt-1">{draft.notes.trim()}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 text-center text-[10px] font-bold uppercase" style={{ color: NAVY }}>
          Thank you for your business
        </div>
        <div className="mt-2 grid grid-cols-3 text-center text-[9px] text-white" style={{ backgroundColor: NAVY }}>
          <div className="border-r py-2" style={{ borderColor: LIME }}>
            <div style={{ color: LIME }}>PayPal</div>
            {companyDetails?.email ? <div className="truncate px-1">{companyDetails.email}</div> : null}
          </div>
          <div className="border-r py-2" style={{ borderColor: LIME }}>
            <div style={{ color: LIME }}>Card</div>
            <div>Visa, MC</div>
          </div>
          <div className="py-2">
            <div style={{ color: LIME }}>Bank</div>
            {showBanking && companyDetails?.bankName ? <div className="truncate px-1">{companyDetails.bankName}</div> : <div>EFT</div>}
          </div>
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

function CoralGeometricPattern({ className }: { className?: string }) {
  const colors = [CORAL_NAVY, CORAL, CORAL_PINK];
  return (
    <div className={cn('grid grid-cols-4 gap-1 opacity-90', className)} aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-6 w-6 rounded-full"
          style={{ backgroundColor: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
}

/** Navy Coral — navy header, coral table, geometric accents */
export function NavyCoralPreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabelUpper,
    isQuote,
  } = props;

  return (
    <div className="bg-[#F2F2F2] text-zinc-800">
      <div className="relative overflow-hidden ref-pad text-white" style={{ backgroundColor: CORAL_NAVY }}>
        <CoralGeometricPattern className="absolute right-2 top-2 w-16 opacity-70" />
        <h1 className="ref-title-lg relative uppercase">{docLabelUpper}.</h1>
        <div className="relative mt-1.5 h-px max-w-[12rem] bg-white/60" />
        <div className="relative mt-4 flex min-w-0 items-center gap-2">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-7 w-7 shrink-0 object-contain brightness-0 invert" />
          ) : (
            <span className="text-base">✈</span>
          )}
          <div className="min-w-0">
            <div className="truncate text-[11px] font-bold uppercase">{companyName}</div>
          </div>
        </div>

        <div className="ref-two-col relative mt-4">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase">{isQuote ? 'Quote To:' : 'Invoice To:'}</div>
            <div className="mt-1 text-[11px] font-bold">{client.companyName || client.name}</div>
            {client.address ? <div className="mt-0.5 text-[10px] text-white/85">{client.address}</div> : null}
            {client.phone ? <div className="text-[10px] text-white/85">{client.phone}</div> : null}
          </div>
          <div className="min-w-0 text-right text-[10px]">
            <div><span className="font-semibold">{isQuote ? 'Quote' : 'Invoice'} no:</span> {invoiceNo}</div>
            <div className="mt-0.5"><span className="font-semibold">Date:</span> {draft.issueDate}</div>
          </div>
        </div>
      </div>

      <div className="ref-pad">
        <PreviewLineGrid
          items={draft.items}
          currency={draft.currency}
          variant="5col"
          headerStyle={{ backgroundColor: CORAL, color: '#111' }}
        />

        <div className="mt-3 bg-white py-1">
          <PreviewTotalsStack
            className="ml-auto max-w-[10rem] px-1"
            rows={[
              { label: 'Sub Total', value: formatMoney(subtotal, draft.currency) },
              { label: 'Tax Vat', value: formatMoney(vat, draft.currency) },
            ]}
          />
        </div>
        <div
          className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-white"
          style={{ backgroundColor: CORAL }}
        >
          <span>Total Amount</span>
          <span className="ref-num">{formatMoney(total, draft.currency)}</span>
        </div>

        <div className="ref-two-col relative mt-5 bg-white p-2">
          <div className="min-w-0">
            {showBanking && companyDetails ? (
              <div>
                <div className="text-[10px] font-bold">Payment Method:</div>
                <BankingDetailsSection companyDetails={companyDetails} variant="inline" />
              </div>
            ) : null}
            {draft.notes?.trim() ? (
              <div className="mt-2">
                <div className="text-[10px] font-bold">Terms and Condition</div>
                <p className="mt-0.5 text-[9px] text-zinc-600">{draft.notes.trim()}</p>
              </div>
            ) : null}
          </div>
          <div className="min-w-0 text-right">
            <div className="ml-auto border-t border-zinc-400 pt-1 text-[10px] text-zinc-500">Account Manager</div>
            <div className="mt-1 text-[11px] font-bold">{companyName}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 ref-pad py-2.5 text-[9px] text-white" style={{ backgroundColor: CORAL_NAVY }}>
        <InvoiceQrFooter
          qrTargetUrl={props.qrTargetUrl}
          headline={props.qrHeadline}
          variant="bar"
          accentColor={CORAL_NAVY}
        />
        <div className="min-w-0 flex-1 text-right">
          {companyDetails?.website ? <div className="truncate">{companyDetails.website}</div> : null}
          {companyDetails?.email ? <div className="truncate">{companyDetails.email}</div> : null}
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

/** Venture — green table, photo sidebar with vertical INVOICE */
export function VenturePreviewLayout(props: InvoicePreviewLayoutProps) {
  const {
    companyName,
    draft,
    client,
    companyDetails,
    subtotal,
    vat,
    total,
    invoiceNo,
    logoSrc,
    showBanking,
    docLabelUpper,
    isQuote,
  } = props;

  return (
    <div className="bg-[#F4F4F4] text-zinc-800">
      <div className="ref-venture">
        <div className="ref-venture-main ref-pad min-w-0">
          <div className="ref-header-row">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex shrink-0 gap-0.5">
                <div className="h-6 w-2 skew-x-[-12deg]" style={{ backgroundColor: VENTURE_GREEN }} />
                <div className="h-6 w-2 skew-x-[-12deg] bg-zinc-700" />
              </div>
              <span className="min-w-0 truncate text-[11px] font-bold">{companyName}</span>
            </div>
            <div className="shrink-0 text-right text-[9px]">
              <div><span className="font-semibold">{isQuote ? 'Quote' : 'Invoice'} no:</span> {invoiceNo}</div>
              <div className="mt-0.5"><span className="font-semibold">Date:</span> {draft.issueDate}</div>
            </div>
          </div>

          <div className="ref-two-col mt-4">
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase">{isQuote ? 'Quote To:' : 'Invoice To:'}</div>
              <div className="mt-0.5 text-[11px] font-bold">{client.companyName || client.name}</div>
              {client.address ? <div className="mt-0.5 text-[10px] text-zinc-600">{client.address}</div> : null}
              {client.phone ? <div className="text-[10px] text-zinc-600">{client.phone}</div> : null}
            </div>
            {showBanking && companyDetails ? (
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase">Payment Method:</div>
                <BankingDetailsSection companyDetails={companyDetails} variant="inline" />
              </div>
            ) : null}
          </div>

          <PreviewLineGrid
            items={draft.items}
            currency={draft.currency}
            headerStyle={{ backgroundColor: VENTURE_GREEN, color: '#fff' }}
            labels={{ desc: 'Description', qty: 'Qty', price: 'Price', total: 'Total' }}
            zebra
          />

          <div className="mt-3 flex justify-end">
            <PreviewTotalsStack
              className="w-full max-w-[10rem] bg-zinc-200/80 px-2 py-2"
              rows={[
                { label: 'Sub Total', value: formatMoney(subtotal, draft.currency) },
                { label: 'Tax Vat', value: formatMoney(vat, draft.currency) },
                { label: 'Total Amount', value: formatMoney(total, draft.currency), emphasis: true },
              ]}
            />
          </div>

          <div className="ref-two-col mt-5">
            {draft.notes?.trim() ? (
              <div className="min-w-0 p-2 text-[9px] text-white" style={{ backgroundColor: VENTURE_GREEN }}>
                <div className="text-[10px] font-bold uppercase">Terms and Condition</div>
                <p className="mt-1">{draft.notes.trim()}</p>
              </div>
            ) : (
              <div />
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500">Account Manager</div>
              <div className="text-[11px] font-bold">{companyName}</div>
            </div>
          </div>
        </div>

        <div
          className="ref-venture-rail flex flex-col items-center justify-between px-2 py-4 text-white"
          style={{
            background: `linear-gradient(180deg, rgba(45,90,60,0.92) 0%, rgba(20,30,25,0.95) 100%)`,
          }}
        >
          <div className="w-full space-y-1 text-[8px] text-white/90">
            {companyDetails?.website ? <div className="truncate">🌐 {companyDetails.website.replace(/^https?:\/\//i, '')}</div> : null}
            {companyDetails?.email ? <div className="truncate">✉ {companyDetails.email}</div> : null}
          </div>

          <div className="ref-vertical-title my-2 font-black uppercase text-white/95">{docLabelUpper}</div>

          <div className="flex w-full flex-col items-center gap-2 text-center">
            <InvoiceQrFooter
              qrTargetUrl={props.qrTargetUrl}
              headline={props.qrHeadline}
              variant="sidebar"
              accentColor={VENTURE_GREEN}
            />
            <div className="text-[8px] font-bold uppercase leading-tight text-white/90">
              Thank You
              <div className="mt-0.5 font-normal normal-case text-white/80">For using our services</div>
            </div>
          </div>
        </div>
      </div>
      <PreviewFooter {...props} />
    </div>
  );
}

export function ReferencePreviewLayout(props: InvoicePreviewLayoutProps & { layout: string }) {
  let content: ReactNode = null;
  switch (props.layout) {
    case 'manblue':
      content = <ManbluePreviewLayout {...props} />;
      break;
    case 'nexus':
      content = <NexusPreviewLayout {...props} />;
      break;
    case 'technosoft':
      content = <TechnosoftPreviewLayout {...props} />;
      break;
    case 'options':
      content = <OptionsPreviewLayout {...props} />;
      break;
    case 'present':
      content = <PresentPreviewLayout {...props} />;
      break;
    case 'tealframe':
      content = <TealFramePreviewLayout {...props} />;
      break;
    case 'navylime':
      content = <NavyLimePreviewLayout {...props} />;
      break;
    case 'navycoral':
      content = <NavyCoralPreviewLayout {...props} />;
      break;
    case 'venture':
      content = <VenturePreviewLayout {...props} />;
      break;
    default:
      content = null;
  }
  if (!content) return null;
  return <div className="ti-ref-preview">{content}</div>;
}
