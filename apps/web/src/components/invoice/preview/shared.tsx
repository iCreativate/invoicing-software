'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/format/money';
import type { InvoiceComposerDraft } from '@/components/invoice/composer/types';
import { InvoiceQrFooter, getQrVariantForTemplate, getQrAccentForTemplate, qrRendersInLayout, type InvoiceQrFooterVariant } from '@/components/invoice/InvoiceQrFooter';
import {
  hasBankingDetails,
  type InvoicePreviewCompanyDetails,
} from '@/features/company/previewDetails';

export type InvoicePreviewClient = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  companyName?: string | null;
  website?: string | null;
  companyRegistration?: string | null;
  vatNumber?: string | null;
};

export type InvoicePreviewLayoutProps = {
  companyName: string;
  companyLogoPath?: string | null;
  companyDetails?: InvoicePreviewCompanyDetails | null;
  draft: InvoiceComposerDraft;
  client: InvoicePreviewClient;
  showPoweredBy?: boolean;
  invoiceViewUrl?: string | null;
  documentKind: 'invoice' | 'quote';
  subtotal: number;
  vat: number;
  total: number;
  invoiceNo: string;
  logoSrc: string | null;
  showBanking: boolean;
  isQuote: boolean;
  docLabel: string;
  docLabelUpper: string;
  dueLabel: string;
  dueLabelLong: string;
  qrTargetUrl: string;
  qrHeadline: string;
  accentHex?: string;
  templateLayout?: string;
};

export function BankingDetailsSection({
  companyDetails,
  variant = 'cards',
}: {
  companyDetails: InvoicePreviewCompanyDetails;
  variant?: 'cards' | 'corporate' | 'inline' | 'timeline';
}) {
  if (!hasBankingDetails(companyDetails)) return null;

  if (variant === 'inline') {
    return (
      <div className="text-xs leading-relaxed text-zinc-600">
        <div className="font-semibold uppercase tracking-wide text-zinc-800">Payment method</div>
        {companyDetails.bankName ? <div className="mt-1 font-medium">{companyDetails.bankName}</div> : null}
        {companyDetails.accountNumber ? <div>Acc: {companyDetails.accountNumber}</div> : null}
        {companyDetails.branchCode ? <div>Branch: {companyDetails.branchCode}</div> : null}
      </div>
    );
  }

  if (variant === 'timeline') {
    return (
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-zinc-900">Payment method</div>
        <div className="mt-3 space-y-3 border-l-2 border-zinc-300 pl-4">
          {companyDetails.bankName ? (
            <div>
              <div className="relative text-xs font-semibold">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#2E3192]" />
                Bank transfer
              </div>
              <div className="mt-1 text-[11px] text-zinc-600">{companyDetails.bankName}</div>
              {companyDetails.accountNumber ? (
                <div className="text-[11px] text-zinc-600">Acc: {companyDetails.accountNumber}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (variant === 'corporate') {
    return (
      <div className="mt-8 rounded-xl bg-zinc-50 p-4">
        <div className="text-xs font-semibold text-zinc-600">Banking details</div>
        <div className="mt-3 border-l-4 border-blue-600 pl-4 text-sm">
          {companyDetails.bankName ? <div className="font-semibold">{companyDetails.bankName}</div> : null}
          <div className="mt-2 space-y-1 text-xs text-zinc-700">
            {companyDetails.accountName ? (
              <div>
                <span className="font-semibold">Account name:</span> {companyDetails.accountName}
              </div>
            ) : null}
            {companyDetails.accountNumber ? (
              <div>
                <span className="font-semibold">Account number:</span> {companyDetails.accountNumber}
              </div>
            ) : null}
            {companyDetails.branchCode ? (
              <div>
                <span className="font-semibold">Branch code:</span> {companyDetails.branchCode}
              </div>
            ) : null}
            {companyDetails.accountType ? (
              <div>
                <span className="font-semibold">Account type:</span> {companyDetails.accountType}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl bg-zinc-50 p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-zinc-600">Banking details</div>
        <div className="text-[11px] font-semibold text-zinc-500">EFT</div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {companyDetails.bankName ? (
          <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
            <div className="text-[11px] font-semibold text-zinc-500">Bank</div>
            <div className="mt-1 text-sm font-semibold">{companyDetails.bankName}</div>
          </div>
        ) : null}
        {companyDetails.accountName ? (
          <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
            <div className="text-[11px] font-semibold text-zinc-500">Account name</div>
            <div className="mt-1 text-sm font-semibold">{companyDetails.accountName}</div>
          </div>
        ) : null}
        {companyDetails.accountNumber ? (
          <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
            <div className="text-[11px] font-semibold text-zinc-500">Account number</div>
            <div className="mt-1 text-sm font-semibold tabular-nums">{companyDetails.accountNumber}</div>
          </div>
        ) : null}
        {companyDetails.branchCode ? (
          <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
            <div className="text-[11px] font-semibold text-zinc-500">Branch code</div>
            <div className="mt-1 text-sm font-semibold tabular-nums">{companyDetails.branchCode}</div>
          </div>
        ) : null}
        {companyDetails.accountType ? (
          <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200 sm:col-span-2">
            <div className="text-[11px] font-semibold text-zinc-500">Account type</div>
            <div className="mt-1 text-sm font-semibold">{companyDetails.accountType}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PreviewFooter({
  showPoweredBy,
  qrTargetUrl,
  qrHeadline,
  accentHex = '#1A3A4A',
  templateLayout,
}: Pick<InvoicePreviewLayoutProps, 'showPoweredBy' | 'qrTargetUrl' | 'qrHeadline' | 'accentHex' | 'templateLayout'>) {
  const qrVariant: InvoiceQrFooterVariant = getQrVariantForTemplate(templateLayout);
  const showQr = !qrRendersInLayout(templateLayout);
  const qrAccent = getQrAccentForTemplate(templateLayout, accentHex);

  return (
    <>
      {showQr ? (
        <div className={cn('ref-pad pt-0', qrVariant === 'dark' && 'px-0 pb-0 pt-0')}>
          <InvoiceQrFooter
            qrTargetUrl={qrTargetUrl}
            headline={qrHeadline}
            variant={qrVariant}
            accentColor={qrAccent}
          />
        </div>
      ) : null}
      {showPoweredBy ? (
        <div className="border-t border-zinc-100 px-6 py-4 text-center text-[11px] font-medium tracking-wide text-zinc-400 print:text-zinc-500">
          Powered by <span className="text-zinc-600">TimelyInvoices</span>
        </div>
      ) : null}
    </>
  );
}

export function ClientBlock({
  client,
  label = 'Invoice to',
}: {
  client: InvoicePreviewClient;
  label?: string;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      {client.companyName ? (
        <>
          <div className="mt-1 text-sm font-bold text-zinc-900">{client.companyName}</div>
          <div className="text-[11px] font-medium text-zinc-700">{client.name}</div>
        </>
      ) : (
        <div className="mt-1 text-sm font-bold text-zinc-900">{client.name}</div>
      )}
      <div className="mt-2 space-y-1 text-xs text-zinc-600">
        {client.address ? <div className="whitespace-pre-wrap">{client.address}</div> : null}
        {client.phone ? <div>P: {client.phone}</div> : null}
        {client.email ? <div>E: {client.email}</div> : null}
      </div>
    </div>
  );
}

export function formatLineTotal(
  quantity: number,
  unitPrice: number,
  vatRate: number,
  currency: string
) {
  const line = quantity * unitPrice;
  const lineVat = line * (vatRate / 100);
  return formatMoney(line + lineVat, currency);
}

export function PreviewTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="ref-table-wrap">
      <table className={cn('ref-table', className)}>{children}</table>
    </div>
  );
}

export function PreviewLineGrid({
  items,
  currency,
  variant = '4col',
  headerStyle,
  headerClassName,
  zebra = false,
  labels = { desc: 'Description', qty: 'Qty', price: 'Price', total: 'Total' },
}: {
  items: InvoiceComposerDraft['items'];
  currency: string;
  variant?: '4col' | '5col';
  headerStyle?: CSSProperties;
  headerClassName?: string;
  zebra?: boolean;
  labels?: { desc: string; qty: string; price: string; total: string };
}) {
  const rowClass = variant === '5col' ? 'ref-grid-row ref-grid-row-5' : 'ref-grid-row';

  return (
    <div className="ref-table-wrap">
      <div className={cn('ref-grid-table ref-grid-head', rowClass, headerClassName)} style={headerStyle}>
        {variant === '5col' ? <div>Ref</div> : null}
        <div>{labels.desc}</div>
        <div className="ref-qty">{labels.qty}</div>
        <div className="ref-num">{labels.price}</div>
        <div className="ref-num">{labels.total}</div>
      </div>
      {items.map((it, idx) => (
        <div key={it.id} className={cn(rowClass, zebra && idx % 2 === 1 && 'bg-zinc-50/80')}>
          {variant === '5col' ? (
            <div className="text-zinc-500">{String(idx + 1).padStart(2, '0')}</div>
          ) : null}
          <div className="min-w-0 break-words font-medium">{it.description || '—'}</div>
          <div className="ref-qty">{it.quantity}</div>
          <div className="ref-num">{formatMoney(it.unitPrice, currency)}</div>
          <div className="ref-num font-semibold">
            {formatLineTotal(it.quantity, it.unitPrice, it.vatRate, currency)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PreviewTotalsStack({
  rows,
  className,
}: {
  rows: Array<{ label: string; value: string; emphasis?: boolean }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1 text-[11px]', className)}>
      {rows.map((row) => (
        <div
          key={row.label}
          className={cn('flex items-start justify-between gap-2', row.emphasis && 'border-t border-zinc-300 pt-1.5 font-bold')}
        >
          <span className="min-w-0 shrink">{row.label}</span>
          <span className="ref-num shrink-0 font-semibold">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
