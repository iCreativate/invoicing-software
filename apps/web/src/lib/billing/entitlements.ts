/**
 * Central plan / entitlement registry.
 * Backend is authoritative — never trust client-supplied plan upgrades.
 */

export type PlanId = 'free' | 'starter' | 'pro' | 'business';

export type EntitlementKey =
  | 'recurring_invoices'
  | 'automated_reminders'
  | 'payment_links'
  | 'team_members'
  | 'advanced_reports'
  | 'cashflow_insights'
  | 'remove_powered_by'
  | 'invoice_templates'
  | 'collections_sequences';

export type PlanDefinition = {
  id: PlanId;
  label: string;
  /** Published ZAR monthly price — do not change without product decision. */
  priceZarMonthly: number;
  entitlements: Partial<Record<EntitlementKey, boolean | number>>;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'Starter',
    priceZarMonthly: 0,
    entitlements: {
      recurring_invoices: false,
      automated_reminders: false,
      payment_links: false,
      team_members: 1,
      advanced_reports: false,
      cashflow_insights: false,
      remove_powered_by: false,
      invoice_templates: 3,
      collections_sequences: false,
    },
  },
  starter: {
    id: 'starter',
    label: 'Starter',
    priceZarMonthly: 0,
    entitlements: {
      recurring_invoices: false,
      automated_reminders: false,
      payment_links: false,
      team_members: 1,
      advanced_reports: false,
      cashflow_insights: false,
      remove_powered_by: false,
      invoice_templates: 3,
      collections_sequences: false,
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    priceZarMonthly: 299,
    entitlements: {
      recurring_invoices: true,
      automated_reminders: true,
      payment_links: true,
      team_members: 3,
      advanced_reports: true,
      cashflow_insights: true,
      remove_powered_by: true,
      invoice_templates: 20,
      collections_sequences: true,
    },
  },
  business: {
    id: 'business',
    label: 'Business',
    priceZarMonthly: 799,
    entitlements: {
      recurring_invoices: true,
      automated_reminders: true,
      payment_links: true,
      team_members: 25,
      advanced_reports: true,
      cashflow_insights: true,
      remove_powered_by: true,
      invoice_templates: 100,
      collections_sequences: true,
    },
  },
};

export function normalizePlanId(raw: string | null | undefined): PlanId {
  const p = String(raw ?? 'free').toLowerCase();
  if (p === 'starter') return 'starter';
  if (p === 'pro') return 'pro';
  if (p === 'business') return 'business';
  return 'free';
}

export function getPlan(plan: string | null | undefined): PlanDefinition {
  return PLANS[normalizePlanId(plan)];
}

export function hasEntitlement(plan: string | null | undefined, key: EntitlementKey): boolean {
  const val = getPlan(plan).entitlements[key];
  if (typeof val === 'number') return val > 0;
  return Boolean(val);
}

export function entitlementLimit(plan: string | null | undefined, key: EntitlementKey): number | null {
  const val = getPlan(plan).entitlements[key];
  if (typeof val === 'number') return val;
  return null;
}

export function subscriptionShowsPoweredBy(plan: string | null | undefined): boolean {
  return !hasEntitlement(plan, 'remove_powered_by');
}
