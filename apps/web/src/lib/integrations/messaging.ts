/**
 * Resend (email) and Twilio (WhatsApp) — optional unless you use those channels.
 * Documented in apps/web/.env.example; set the same keys on Netlify (server-side).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ResendCtor: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let TwilioFactory: any = null;

export async function getResend(): Promise<any | null> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!ResendCtor) {
    const mod = await import('resend');
    ResendCtor = mod.Resend;
  }
  return new ResendCtor(key);
}

export async function getTwilio(): Promise<any | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) return null;
  if (!TwilioFactory) {
    const mod = await import('twilio');
    TwilioFactory = mod.default ?? mod;
  }
  return TwilioFactory(sid, token);
}

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || 'TimelyInvoices <invoices@timelyinvoices.app>';
}

export function isWhatsappEnvReady(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim()
  );
}

/** True when `RESEND_API_KEY` is set (same variable as apps/web/.env.local). */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Composer / settings copy when server status is unknown (no secrets). */
export const MESSAGING_ENV_HINT =
  'Email uses RESEND_API_KEY from the server environment (apps/web/.env.local or Netlify).';

export const ERR_RESEND_MISSING =
  'Email is not configured. Add RESEND_API_KEY to your environment (Netlify → Environment variables). See apps/web/.env.example.';

export const ERR_WHATSAPP_MISSING =
  'WhatsApp is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM (Twilio sandbox or approved sender). See apps/web/.env.example.';
