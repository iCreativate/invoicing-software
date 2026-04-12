/** Canonical web origin for links and QR codes (set in production). */
export function getAppPublicBaseUrl(): string {
  const raw = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : 'https://timelyinvoices.app';
  return raw.replace(/\/$/, '');
}

/** Public marketing / home URL for the TimelyInvoices product. */
export function getTimelyInvoicesMarketingUrl(): string {
  const raw = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MARKETING_URL ? process.env.NEXT_PUBLIC_MARKETING_URL : 'https://timelyinvoices.app';
  return raw.replace(/\/$/, '');
}

/** Client-facing URL for this invoice when a share id exists. */
export function buildPublicInvoiceViewUrl(publicShareId: string | null | undefined): string | null {
  if (!publicShareId || !String(publicShareId).trim()) return null;
  return `${getAppPublicBaseUrl()}/invoice/${String(publicShareId).trim()}`;
}
