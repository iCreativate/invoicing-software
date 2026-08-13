/**
 * Lightweight feature-flag stub. Keys map to NEXT_PUBLIC_FF_<KEY> env vars.
 * Example: FLAGS.cashflowInsights → process.env.NEXT_PUBLIC_FF_CASHFLOW_INSIGHTS
 */

export const FLAGS = {
  cashflowInsights: 'CASHFLOW_INSIGHTS',
  collectionsSequences: 'COLLECTIONS_SEQUENCES',
  timelyInsights: 'TIMELY_INSIGHTS',
  paymentScore: 'PAYMENT_SCORE',
  onboardingWizard: 'ONBOARDING_WIZARD',
} as const;

export type FlagKey = keyof typeof FLAGS;

function envNameFor(key: FlagKey): string {
  return `NEXT_PUBLIC_FF_${FLAGS[key]}`;
}

/** True when the matching NEXT_PUBLIC_FF_* env is "1" or "true" (case-insensitive). */
export function isEnabled(key: FlagKey): boolean {
  const raw = process.env[envNameFor(key)];
  if (raw == null || raw === '') return false;
  const v = String(raw).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}
