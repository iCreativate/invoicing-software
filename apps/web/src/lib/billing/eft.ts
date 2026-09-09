/**
 * Platform Pay-by-EFT helpers. Bank details come from env only — never hardcode.
 */

import { getPlan, normalizePlanId, type PlanId } from '@/lib/billing/entitlements';

const PLATFORM_TRADING_NAME = 'Timely Invoices';

export type EftBankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  /** UI line for Billing: account name, with “Trading as …” only when holder ≠ Timely Invoices */
  accountNameDisplay: string;
  configured: boolean;
};

function formatAccountNameDisplay(accountName: string): string {
  if (!accountName) {
    return `Account name: (not configured)`;
  }
  // When the bank account already IS Timely Invoices, skip the redundant “Trading as” split.
  if (accountName.toLowerCase() === PLATFORM_TRADING_NAME.toLowerCase()) {
    return `Account name: ${accountName}`;
  }
  return `Account name: ${accountName} · Trading as ${PLATFORM_TRADING_NAME}`;
}

export function getEftBankDetailsFromEnv(
  env: Record<string, string | undefined> = process.env
): EftBankDetails {
  const bankName = String(env.TIMELY_EFT_BANK_NAME ?? '').trim();
  const accountName = String(env.TIMELY_EFT_ACCOUNT_NAME ?? '').trim();
  const accountNumber = String(env.TIMELY_EFT_ACCOUNT_NUMBER ?? '').trim();
  const branchCode = String(env.TIMELY_EFT_BRANCH_CODE ?? '').trim();
  const accountType = String(env.TIMELY_EFT_ACCOUNT_TYPE ?? '').trim();
  const configured = Boolean(bankName && accountName && accountNumber && branchCode);
  const accountNameDisplay = formatAccountNameDisplay(accountName);
  return {
    bankName,
    accountName,
    accountNumber,
    branchCode,
    accountType,
    accountNameDisplay,
    configured,
  };
}

/** Short payment reference: TI-{first 8 hex of owner id without dashes}. */
export function buildEftReference(ownerId: string): string {
  const hex = String(ownerId).replace(/-/g, '').toLowerCase();
  const short = (hex.slice(0, 8) || 'unknown').toUpperCase();
  return `TI-${short}`;
}

export function eftAmountCentsForPlan(plan: string | null | undefined): number | null {
  const id = normalizePlanId(plan);
  if (id !== 'pro' && id !== 'business') return null;
  return Math.round(getPlan(id).priceZarMonthly * 100);
}

export function isPaidEftPlan(plan: string | null | undefined): plan is 'pro' | 'business' {
  const id = normalizePlanId(plan);
  return id === 'pro' || id === 'business';
}

export type PaidEftPlan = Extract<PlanId, 'pro' | 'business'>;
