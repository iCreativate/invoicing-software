'use client';

import { formatMoney } from '@/lib/format/money';
import type { InvoiceComposerDraft } from '@/components/invoice/composer/types';

export function InvoicePreview({
  companyName = 'TimelyInvoices',
  companyLogoPath,
  companyDetails,
  draft,
  client,
  showPoweredBy = false,
}: {
  companyName?: string;
  companyLogoPath?: string | null;
  companyDetails?: {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    website?: string | null;
    vatNumber?: string | null;
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    branchCode?: string | null;
    accountType?: string | null;
  } | null;
  draft: InvoiceComposerDraft;
  client: { name: string; email?: string | null; phone?: string | null; address?: string | null };
  /** Free plan branding on PDFs and public shares. */
  showPoweredBy?: boolean;
}) {
  const subtotal = draft.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vat = draft.items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate / 100), 0);
  const total = subtotal + vat;

  const template = draft.template ?? 'modern';
  const isCorporate = template === 'corporate';
  const headerTone = isCorporate
    ? 'bg-white text-zinc-900'
    : template === 'bold'
      ? 'bg-zinc-900 text-white'
      : template === 'elegant'
        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
        : 'bg-zinc-50 text-zinc-900';

  const invoiceNo = (draft as any).invoiceNumber ? String((draft as any).invoiceNumber) : '—';

  return (
    <div className="rounded-2xl bg-white text-zinc-900 shadow-[var(--shadow-md)] overflow-hidden">
      <div className={headerTone}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                {companyLogoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/storage/logo?path=${encodeURIComponent(companyLogoPath)}`}
                    alt="Company logo"
                    className={isCorporate ? 'h-12 w-32 object-contain' : 'h-12 w-32 object-contain'}
                  />
                ) : null}
                {!companyLogoPath ? <div className="text-sm font-semibold">{companyName}</div> : null}
              </div>
              {!isCorporate ? (
                <div className={template === 'bold' || template === 'elegant' ? 'mt-1 text-xs text-white/80' : 'mt-1 text-xs text-zinc-600'}>
                  Professional invoice
                </div>
              ) : null}
            </div>

            {isCorporate ? (
              <div className="text-right">
                <div className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-xl font-semibold tracking-wide text-white">
                  INVOICE
                </div>
                <div className="mt-3 space-y-1 text-xs text-zinc-600">
                  <div>
                    <span className="font-semibold text-zinc-700">INVOICE NO.:</span> {invoiceNo}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-700">Invoice Date:</span> {draft.issueDate}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-700">Due Date:</span> {draft.dueDate}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className={template === 'minimal' ? 'text-xl font-semibold tracking-tight' : 'text-2xl font-semibold tracking-tight'}>
                  INVOICE
                </div>
                <div className={template === 'bold' || template === 'elegant' ? 'mt-1 text-xs text-white/80' : 'mt-1 text-xs text-zinc-600'}>
                  <span className={template === 'bold' || template === 'elegant' ? 'text-white/80' : 'text-zinc-600'}>
                    No: <span className={template === 'bold' || template === 'elegant' ? 'text-white' : 'text-zinc-900'}>{invoiceNo}</span>
                  </span>
                  <span className="mx-2">·</span>
                  Issue: {draft.issueDate} · Due: {draft.dueDate}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-zinc-600">{isCorporate ? 'Invoice To:' : 'Bill to'}</div>
            <div className={isCorporate ? 'mt-3 rounded-xl bg-zinc-50 p-4' : ''}>
              <div className="text-sm font-semibold">{client.name}</div>
              <div className="mt-2 space-y-1 text-xs text-zinc-600">
                {client.phone ? <div>P: {client.phone}</div> : null}
                {client.email ? <div>E: {client.email}</div> : null}
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
            <thead
              className={
                isCorporate
                  ? 'text-xs text-white'
                  : template === 'bold' || template === 'elegant'
                    ? 'bg-zinc-900 text-xs text-white'
                    : 'bg-zinc-50 text-xs text-zinc-600'
              }
            >
              <tr className={isCorporate ? 'bg-transparent' : ''}>
                <th className={isCorporate ? 'bg-blue-600 px-4 py-3 text-left font-semibold' : 'px-4 py-3 text-left font-semibold'}>
                  Item description
                </th>
                <th className={isCorporate ? 'bg-blue-600 px-4 py-3 text-right font-semibold' : 'px-4 py-3 text-right font-semibold'}>
                  Quantity
                </th>
                <th className={isCorporate ? 'bg-blue-600 px-4 py-3 text-right font-semibold' : 'px-4 py-3 text-right font-semibold'}>
                  Unit Price
                </th>
                <th className={isCorporate ? 'bg-blue-600 px-4 py-3 text-right font-semibold' : 'px-4 py-3 text-right font-semibold'}>
                  VAT
                </th>
                <th className={isCorporate ? 'bg-fuchsia-600 px-4 py-3 text-right font-semibold' : 'px-4 py-3 text-right font-semibold'}>
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
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(line + lineVat, draft.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>

        {isCorporate ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_360px] sm:items-start">
            <div>
              {companyDetails?.bankName ||
              companyDetails?.accountNumber ||
              companyDetails?.accountName ||
              companyDetails?.branchCode ||
              companyDetails?.accountType ? (
                <div className="rounded-xl bg-zinc-50 p-4">
                  <div className="text-xs font-semibold text-zinc-600">Banking Details</div>
                  <div className="mt-3 border-l-4 border-blue-600 pl-4 text-sm">
                    {companyDetails?.bankName ? <div className="font-semibold">{companyDetails.bankName}</div> : null}
                    <div className="mt-2 space-y-1 text-xs text-zinc-700">
                      {companyDetails?.accountName ? (
                        <div>
                          <span className="font-semibold">Account Name:</span> {companyDetails.accountName}
                        </div>
                      ) : null}
                      {companyDetails?.accountNumber ? (
                        <div>
                          <span className="font-semibold">Account Number:</span> {companyDetails.accountNumber}
                        </div>
                      ) : null}
                      {companyDetails?.branchCode ? (
                        <div>
                          <span className="font-semibold">Branch Code:</span> {companyDetails.branchCode}
                        </div>
                      ) : null}
                      {companyDetails?.accountType ? (
                        <div>
                          <span className="font-semibold">Account Type:</span> {companyDetails.accountType}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl bg-blue-600 p-5 text-white">
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
                <span className="text-zinc-600">Subtotal</span>
                <span className="font-semibold">{formatMoney(subtotal, draft.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">VAT</span>
                <span className="font-semibold">{formatMoney(vat, draft.currency)}</span>
              </div>
              <div className="h-px bg-zinc-200" />
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatMoney(total, draft.currency)}</span>
              </div>
            </div>
          </div>
        )}

      {companyDetails?.bankName ||
      companyDetails?.accountNumber ||
      companyDetails?.accountName ||
      companyDetails?.branchCode ||
      companyDetails?.accountType ? (
        <div className={isCorporate ? 'hidden' : 'mt-8 rounded-2xl bg-zinc-50 p-5'}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-zinc-600">Banking details</div>
            <div className="text-[11px] font-semibold text-zinc-500">EFT</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {companyDetails?.bankName ? (
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <div className="text-[11px] font-semibold text-zinc-500">Bank</div>
                <div className="mt-1 text-sm font-semibold">{companyDetails.bankName}</div>
              </div>
            ) : null}
            {companyDetails?.accountName ? (
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <div className="text-[11px] font-semibold text-zinc-500">Account name</div>
                <div className="mt-1 text-sm font-semibold">{companyDetails.accountName}</div>
              </div>
            ) : null}
            {companyDetails?.accountNumber ? (
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <div className="text-[11px] font-semibold text-zinc-500">Account number</div>
                <div className="mt-1 text-sm font-semibold tabular-nums">{companyDetails.accountNumber}</div>
              </div>
            ) : null}
            {companyDetails?.branchCode ? (
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <div className="text-[11px] font-semibold text-zinc-500">Branch code</div>
                <div className="mt-1 text-sm font-semibold tabular-nums">{companyDetails.branchCode}</div>
              </div>
            ) : null}
            {companyDetails?.accountType ? (
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200 sm:col-span-2">
                <div className="text-[11px] font-semibold text-zinc-500">Account type</div>
                <div className="mt-1 text-sm font-semibold">{companyDetails.accountType}</div>
              </div>
            ) : null}
          </div>
        </div>
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

        {showPoweredBy ? (
          <div className="border-t border-zinc-100 px-6 py-4 text-center text-[11px] font-medium tracking-wide text-zinc-400 print:text-zinc-500">
            Powered by <span className="text-zinc-600">TimelyInvoices</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

