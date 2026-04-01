import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import { subscriptionShowsPoweredBy as subscriptionShowsPoweredByFn } from '@/lib/company/subscription';
import type { CompanyProfile } from './types';

export const subscriptionShowsPoweredBy = subscriptionShowsPoweredByFn;

const baseCols = 'id,owner_id,company_name,email,phone,address,website,vat_number,logo_url';
const bankCols = 'bank_name,account_name,account_number,branch_code,account_type';
const planCols = 'subscription_plan,preferred_locale,base_currency,referral_code,referred_by_code';

const baseSelect = baseCols;
const midSelect = `${baseCols},${bankCols}`;
const fullSelect = `${midSelect},${planCols}`;

function schemaLagError(err: unknown, hints: string[]): boolean {
  const msg = String((err as any)?.message ?? '').toLowerCase();
  return hints.some((h) => msg.includes(h.toLowerCase()));
}

function mapRow(row: any): CompanyProfile {
  return {
    id: String(row.id),
    ownerId: row.owner_id ? String(row.owner_id) : null,
    companyName: String(row.company_name ?? ''),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    address: row.address ? String(row.address) : null,
    website: row.website ? String(row.website) : null,
    vatNumber: row.vat_number ? String(row.vat_number) : null,
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    bankName: row.bank_name != null ? String(row.bank_name) : null,
    accountName: row.account_name != null ? String(row.account_name) : null,
    accountNumber: row.account_number != null ? String(row.account_number) : null,
    branchCode: row.branch_code != null ? String(row.branch_code) : null,
    accountType: row.account_type != null ? String(row.account_type) : null,
    subscriptionPlan: row.subscription_plan != null ? String(row.subscription_plan) : null,
    preferredLocale: row.preferred_locale != null ? String(row.preferred_locale) : null,
    baseCurrency: row.base_currency != null ? String(row.base_currency) : null,
    referralCode: row.referral_code != null ? String(row.referral_code) : null,
    referredByCode: row.referred_by_code != null ? String(row.referred_by_code) : null,
  };
}

async function selectCompanyProfileRow(supabase: ReturnType<typeof createSupabaseBrowserClient>, ownerId: string) {
  for (const sel of [fullSelect, midSelect, baseSelect]) {
    const res = await supabase.from('company_profiles').select(sel).eq('owner_id', ownerId).maybeSingle();
    if (!res.error) return res.data;
    const lag =
      sel === fullSelect
        ? schemaLagError(res.error, ['subscription_plan', 'referral_code', 'preferred_locale', 'base_currency', 'referred_by'])
        : sel === midSelect
          ? schemaLagError(res.error, ['bank_name', 'account_name', 'branch_code', 'account_type'])
          : false;
    if (!lag) throw res.error;
  }
  return null;
}

export async function fetchMyCompanyProfile(): Promise<CompanyProfile | null> {
  const supabase = createSupabaseBrowserClient();
  let workspaceOwnerId: string;
  try {
    workspaceOwnerId = await getWorkspaceOwnerIdForClient();
  } catch {
    return null;
  }

  const row = await selectCompanyProfileRow(supabase, workspaceOwnerId);
  return row ? mapRow(row) : null;
}

function makeReferralCode(): string {
  const part = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase() : String(Math.random()).slice(2, 10);
  return `TI-${part}`;
}

/** Ensures a stable referral_code exists (best-effort if column missing). */
export async function ensureReferralCode(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const workspaceOwnerId = await getWorkspaceOwnerIdForClient();

  const existing = await fetchMyCompanyProfile();
  if (existing?.referralCode) return existing.referralCode;

  const code = makeReferralCode();
  const { error } = await supabase.from('company_profiles').update({ referral_code: code }).eq('owner_id', workspaceOwnerId);
  if (error) {
    const msg = String((error as any).message ?? '');
    if (msg.includes('referral_code') || msg.includes('column')) return null;
    throw error;
  }
  return code;
}

export async function upsertMyCompanyProfile(input: {
  companyName: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  vatNumber?: string;
  logoUrl?: string | null;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: string;
  subscriptionPlan?: string;
  preferredLocale?: string;
  baseCurrency?: string;
}): Promise<CompanyProfile> {
  const supabase = createSupabaseBrowserClient();
  const workspaceOwnerId = await getWorkspaceOwnerIdForClient();

  const basePayload: Record<string, unknown> = {
    owner_id: workspaceOwnerId,
    company_name: input.companyName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    website: input.website ?? null,
    vat_number: input.vatNumber ?? null,
    logo_url: input.logoUrl ?? null,
  };

  const bankPayload = {
    ...basePayload,
    bank_name: input.bankName ?? null,
    account_name: input.accountName ?? null,
    account_number: input.accountNumber ?? null,
    branch_code: input.branchCode ?? null,
    account_type: input.accountType ?? null,
  };

  const fullPayload = {
    ...bankPayload,
    subscription_plan: input.subscriptionPlan ?? undefined,
    preferred_locale: input.preferredLocale ?? undefined,
    base_currency: input.baseCurrency ?? undefined,
  };

  const tryUpsert = async (payload: Record<string, unknown>, select: string) => {
    return supabase.from('company_profiles').upsert(payload, { onConflict: 'owner_id' }).select(select).single();
  };

  let { data, error } = await tryUpsert(fullPayload, fullSelect);
  if (error && schemaLagError(error, ['subscription_plan', 'referral_code', 'preferred_locale', 'base_currency'])) {
    ({ data, error } = await tryUpsert(bankPayload, midSelect));
  }
  if (error && schemaLagError(error, ['bank_name', 'account_name', 'branch_code'])) {
    const bankingProvided = Boolean(
      input.bankName || input.accountName || input.accountNumber || input.branchCode || input.accountType
    );
    if (bankingProvided) {
      throw new Error(
        'Banking columns are missing in Supabase. Run the latest SQL in `apps/web/supabase/schema.sql` and try again.'
      );
    }
    ({ data, error } = await tryUpsert(basePayload, baseSelect));
  }

  if (error) throw error;
  return mapRow(data);
}

export async function uploadCompanyLogo(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const workspaceOwnerId = await getWorkspaceOwnerIdForClient();

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${workspaceOwnerId}/logo.${ext}`;

  const { error: upErr } = await supabase.storage.from('logos').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;

  return path;
}

export type ReferralRewardRow = { id: string; amount: number; currency: string; reason: string; createdAt: string };

export async function fetchMyReferralRewards(): Promise<ReferralRewardRow[]> {
  const supabase = createSupabaseBrowserClient();
  const workspaceOwnerId = await getWorkspaceOwnerIdForClient();

  const { data, error } = await supabase
    .from('referral_rewards')
    .select('id,amount,currency,reason,created_at')
    .eq('owner_id', workspaceOwnerId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    const msg = String((error as any).message ?? '');
    if (msg.includes('referral_rewards') || msg.includes('does not exist')) return [];
    throw error;
  }
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    amount: Number(r.amount ?? 0),
    currency: String(r.currency ?? 'ZAR'),
    reason: String(r.reason ?? ''),
    createdAt: String(r.created_at ?? ''),
  }));
}

