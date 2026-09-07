'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getTimelyInvoicesMarketingUrl } from '@/lib/invoice/platformUrls';
import { cn } from '@/lib/utils/cn';

export type InvoiceQrFooterVariant = 'embedded' | 'accent-strip' | 'dark' | 'sidebar' | 'bar' | 'card';

type Props = {
  /** Encoded in the QR code (public invoice URL or marketing URL). */
  qrTargetUrl: string;
  /** One line shown next to / under the QR. */
  headline: string;
  variant?: InvoiceQrFooterVariant;
  accentColor?: string;
  className?: string;
};

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//i, '');
}

export function InvoiceQrFooter({
  qrTargetUrl,
  headline,
  variant = 'embedded',
  accentColor = '#1A3A4A',
  className,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const marketing = getTimelyInvoicesMarketingUrl();
  const isDark = variant === 'dark';
  const isSidebar = variant === 'sidebar';
  const isBar = variant === 'bar';
  const isEmbedded = variant === 'embedded' || variant === 'accent-strip';
  const size = isBar ? 40 : isSidebar ? 52 : isEmbedded ? 72 : 132;

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(qrTargetUrl, {
      width: size * 2,
      margin: isSidebar ? 0 : 1,
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
  }, [qrTargetUrl, size, isSidebar]);

  const qrImage = dataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt=""
      width={size}
      height={size}
      className={cn(
        'shrink-0 object-contain',
        isBar && 'h-10 w-10 bg-white p-0.5',
        isSidebar && 'h-[52px] w-[52px] bg-white p-0.5',
        isEmbedded && !isDark && 'h-[72px] w-[72px] rounded-sm',
        isDark && 'rounded-lg bg-white p-1',
        !isBar && !isSidebar && !isEmbedded && !isDark && 'h-[132px] w-[132px] rounded-lg border border-zinc-200 bg-white',
        !isBar && !isSidebar && !isEmbedded && isDark && 'h-[72px] w-[72px]'
      )}
    />
  ) : (
    <div
      className={cn(
        'animate-pulse bg-zinc-200',
        isBar && 'h-10 w-10',
        isSidebar && 'h-[52px] w-[52px]',
        isEmbedded && 'h-[72px] w-[72px] rounded-sm',
        isDark && 'h-[72px] w-[72px] rounded-lg bg-white/20',
        !isBar && !isSidebar && !isEmbedded && !isDark && 'h-[132px] w-[132px] rounded-lg',
        !isBar && !isSidebar && !isEmbedded && isDark && 'h-[72px] w-[72px] rounded-lg'
      )}
      aria-hidden
    />
  );

  if (variant === 'bar') {
    return (
      <div className={cn('flex shrink-0 items-center gap-2', className)}>
        {qrImage}
        <div className="min-w-0 text-[8px] leading-tight text-white/85">
          <div className="font-bold uppercase tracking-wide">Scan to view</div>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn('flex flex-col items-center gap-1.5 text-center', className)}>
        {qrImage}
        <div className="text-[7px] font-semibold uppercase leading-tight tracking-wide text-white/90">Scan to view</div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 print:border-zinc-300 print:bg-white', className)}>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">TimelyInvoices</div>
        <div className="mt-3 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
          <div className="flex shrink-0 justify-center sm:justify-start">{qrImage}</div>
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
                {displayUrl(marketing)}
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div
        className={cn('border-t border-white/15 px-4 py-3 text-white', className)}
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-3">
          {qrImage}
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold uppercase tracking-wide text-white/70">Scan code</div>
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-white">{headline}</p>
            <p className="mt-1 truncate text-[9px] text-white/60">{displayUrl(qrTargetUrl)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'accent-strip') {
    return (
      <div className={cn('ref-pad border-t border-zinc-200/80', className)}>
        <div
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-white"
          style={{ backgroundColor: accentColor }}
        >
          {qrImage}
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold uppercase tracking-wide text-white/75">Scan to view</div>
            <p className="mt-0.5 break-words text-[10px] font-medium leading-snug">{headline}</p>
          </div>
        </div>
      </div>
    );
  }

  // embedded — flush with document body
  return (
    <div className={cn('ti-qr-embedded border-t border-zinc-200/90 pt-4', className)}>
      <div
        className="mb-3 h-0.5 w-12 rounded-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden
      />
      <div className="flex items-start gap-3">
        {qrImage}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: accentColor }}>
            Scan to view
          </div>
          <p className="mt-1 text-[10px] font-medium leading-snug text-zinc-700">{headline}</p>
          <p className="mt-1.5 truncate text-[9px] text-zinc-500">
            <a href={qrTargetUrl} className="hover:underline" style={{ color: accentColor }}>
              {displayUrl(qrTargetUrl)}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export function getQrVariantForTemplate(layout: string | undefined): InvoiceQrFooterVariant {
  switch (layout) {
    case 'navylime':
      return 'dark';
    case 'venture':
      return 'sidebar';
    case 'options':
    case 'tealframe':
    case 'manblue':
      return 'accent-strip';
    default:
      return 'embedded';
  }
}

/** QR in sidebar / inline layouts — hide the document footer duplicate. */
export function qrRendersInLayout(layout: string | undefined) {
  return layout === 'venture' || layout === 'navycoral';
}

export function getQrAccentForTemplate(layout: string | undefined, accentHex: string) {
  switch (layout) {
    case 'navylime':
      return '#282C3F';
    case 'navycoral':
      return '#1A2B4C';
    default:
      return accentHex;
  }
}
