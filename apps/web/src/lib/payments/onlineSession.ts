import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPayFastPaymentUrl } from '@/lib/payments/payfast';
import { requirePublicAppUrl } from '@/lib/app-url';

export type OnlinePaymentProvider = 'payfast' | 'snapscan' | 'ozow';

export function paymentMethodForProvider(provider: string): string {
  if (provider === 'snapscan') return 'qr';
  if (provider === 'ozow') return 'instant_eft';
  return 'card_or_eft';
}

/** Public invoice path clients can open after PayFast return/cancel. */
export function publicInvoiceReturnPath(publicShareId: string): string {
  return `/invoice/${publicShareId}`;
}

/**
 * Ensure the invoice has a public_share_id suitable for PayFast return URLs.
 * Mutates via the provided client (user-scoped or service-role).
 */
export async function ensureInvoicePublicShareId(
  supabase: SupabaseClient,
  invoiceId: string,
  existingShareId: string | null | undefined,
  ownerId?: string | null
): Promise<string> {
  const current = existingShareId ? String(existingShareId).trim() : '';
  if (current) return current;

  const shareId = randomUUID();
  let q = supabase.from('invoices').update({ public_share_id: shareId }).eq('id', invoiceId);
  if (ownerId) q = q.eq('owner_id', ownerId);
  const { error } = await q;
  if (error) throw new Error(error.message);
  return shareId;
}

type BuildRedirectInput = {
  supabase: SupabaseClient;
  sessionId: string;
  provider: string;
  amount: number;
  invoiceNumber: string | null;
  clientEmail?: string | null;
  /** Absolute or path used under requirePublicAppUrl for PayFast return/cancel. */
  publicShareId: string;
};

export async function buildProviderRedirect(input: BuildRedirectInput): Promise<
  | { ok: true; redirectUrl: string }
  | { ok: false; status: number; error: string }
> {
  const { supabase, sessionId, provider, amount, invoiceNumber, clientEmail, publicShareId } = input;
  const appUrl = requirePublicAppUrl();
  const returnPath = publicInvoiceReturnPath(publicShareId);

  if (provider === 'payfast') {
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
    const sandbox = process.env.PAYFAST_SANDBOX === '1';

    if (!merchantId || !merchantKey) {
      return { ok: false, status: 500, error: 'Missing env: PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY' };
    }

    const pf = buildPayFastPaymentUrl({
      config: {
        merchantId,
        merchantKey,
        passphrase,
        sandbox,
        returnUrl: `${appUrl}${returnPath}?paid=1`,
        cancelUrl: `${appUrl}${returnPath}?cancelled=1`,
        notifyUrl: `${appUrl}/api/payments/webhook/payfast`,
      },
      mPaymentId: sessionId,
      amount,
      itemName: invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice payment',
      itemDescription: 'TimelyInvoices payment',
      emailAddress: clientEmail ? String(clientEmail) : undefined,
    });

    await supabase.from('payment_sessions').update({ redirect_url: pf.url, status: 'pending' }).eq('id', sessionId);
    return { ok: true, redirectUrl: pf.url };
  }

  if (provider === 'snapscan') {
    const snapCode = process.env.SNAPSCAN_SNAPCODE;
    if (!snapCode) {
      return { ok: false, status: 500, error: 'Missing env: SNAPSCAN_SNAPCODE' };
    }
    const cents = Math.round(amount * 100);
    const qrUrl = `https://pos.snapscan.io/qr/${encodeURIComponent(snapCode)}?id=${encodeURIComponent(sessionId)}&amount=${cents}&strict=true`;
    await supabase.from('payment_sessions').update({ redirect_url: qrUrl, status: 'pending' }).eq('id', sessionId);
    return { ok: true, redirectUrl: qrUrl };
  }

  if (provider === 'ozow') {
    return {
      ok: false,
      status: 501,
      error: 'Ozow Instant EFT not fully implemented yet (needs merchant credentials + hash spec).',
    };
  }

  return { ok: false, status: 400, error: 'Unsupported provider' };
}
