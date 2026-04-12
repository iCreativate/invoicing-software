'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getTimelyInvoicesMarketingUrl } from '@/lib/invoice/platformUrls';

type Props = {
  /** Encoded in the QR code (public invoice URL or marketing URL). */
  qrTargetUrl: string;
  /** One line shown next to / under the QR. */
  headline: string;
};

export function InvoiceQrFooter({ qrTargetUrl, headline }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const marketing = getTimelyInvoicesMarketingUrl();

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(qrTargetUrl, {
      width: 132,
      margin: 1,
      color: { dark: '#18181b', light: '#ffffff' },
    })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {
        if (alive) setDataUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [qrTargetUrl]);

  return (
    <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 print:border-zinc-300 print:bg-white">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">TimelyInvoices</div>
      <div className="mt-3 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 justify-center sm:justify-start">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt=""
              width={132}
              height={132}
              className="h-[132px] w-[132px] rounded-lg border border-zinc-200 bg-white"
            />
          ) : (
            <div className="h-[132px] w-[132px] animate-pulse rounded-lg bg-zinc-200" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-xs text-zinc-700">
          <p className="font-medium text-zinc-800">{headline}</p>
          <p className="break-all text-[11px] leading-snug">
            <a href={qrTargetUrl} className="text-blue-700 underline">
              {qrTargetUrl}
            </a>
          </p>
          <p className="text-[11px] text-zinc-600">
            Platform:{' '}
            <a href={marketing} className="font-medium text-blue-700 underline">
              {marketing.replace(/^https?:\/\//, '')}
            </a>
          </p>
          <p className="text-[10px] text-zinc-500 print:text-zinc-600">
            To save a PDF: open this page and use Print → Save as PDF (or use the link above on any device).
          </p>
        </div>
      </div>
    </div>
  );
}
