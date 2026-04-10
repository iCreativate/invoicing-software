import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCanEdit, getWorkspaceContext } from '@/lib/auth/workspace';
import { canEditRecords, canManageTeam } from '@/lib/permissions/team';

function mapProfile(row: any) {
  return {
    id: String(row.id),
    companyName: String(row.company_name ?? ''),
    email: row.email != null ? String(row.email) : null,
    phone: row.phone != null ? String(row.phone) : null,
    address: row.address != null ? String(row.address) : null,
    website: row.website != null ? String(row.website) : null,
    vatNumber: row.vat_number != null ? String(row.vat_number) : null,
    logoUrl: row.logo_url != null ? String(row.logo_url) : null,
    bankName: row.bank_name != null ? String(row.bank_name) : null,
    accountName: row.account_name != null ? String(row.account_name) : null,
    accountNumber: row.account_number != null ? String(row.account_number) : null,
    branchCode: row.branch_code != null ? String(row.branch_code) : null,
    accountType: row.account_type != null ? String(row.account_type) : null,
    subscriptionPlan: row.subscription_plan != null ? String(row.subscription_plan) : 'free',
    preferredLocale: row.preferred_locale != null ? String(row.preferred_locale) : 'en',
    baseCurrency: row.base_currency != null ? String(row.base_currency) : 'ZAR',
    referralCode: row.referral_code != null ? String(row.referral_code) : null,
    referredByCode: row.referred_by_code != null ? String(row.referred_by_code) : null,
    invoiceAccentHex: row.invoice_accent_hex != null ? String(row.invoice_accent_hex) : null,
    invoiceHeaderHex: row.invoice_header_hex != null ? String(row.invoice_header_hex) : null,
    emailTemplateInvoice: row.email_template_invoice != null ? String(row.email_template_invoice) : null,
    emailTemplateReminder: row.email_template_reminder != null ? String(row.email_template_reminder) : null,
  };
}

const SELECT_WITH_BRANDING = `
  id,
  owner_id,
  company_name,
  email,
  phone,
  address,
  website,
  vat_number,
  logo_url,
  bank_name,
  account_name,
  account_number,
  branch_code,
  account_type,
  subscription_plan,
  preferred_locale,
  base_currency,
  referral_code,
  referred_by_code,
  invoice_accent_hex,
  invoice_header_hex,
  email_template_invoice,
  email_template_reminder
`;

const SELECT_BASE = `
  id,
  owner_id,
  company_name,
  email,
  phone,
  address,
  website,
  vat_number,
  logo_url,
  bank_name,
  account_name,
  account_number,
  branch_code,
  account_type,
  subscription_plan,
  preferred_locale,
  base_currency,
  referral_code,
  referred_by_code
`;

async function loadProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, ownerId: string) {
  let { data, error }: { data: any; error: any } = await supabase
    .from('company_profiles')
    .select(SELECT_WITH_BRANDING)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) {
    const msg = String((error as any).message ?? '').toLowerCase();
    if (msg.includes('invoice_accent') || msg.includes('email_template') || msg.includes('column')) {
      const fb = await supabase.from('company_profiles').select(SELECT_BASE).eq('owner_id', ownerId).maybeSingle();
      data = fb.data;
      error = fb.error;
    }
  }
  if (error) throw error;
  return data;
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const row = await loadProfile(supabase, ctx.workspaceOwnerId);

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          permission: ctx.permission,
          canManageTeam: canManageTeam(ctx.permission),
          canEdit: canEditRecords(ctx.permission),
        },
        company: row ? mapProfile(row) : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to load settings.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    assertCanEdit(ctx);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const companyName = body.companyName != null ? String(body.companyName).trim() : '';
    if (companyName.length < 2) {
      return NextResponse.json({ success: false, error: 'companyName is required (min 2 characters).' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      owner_id: ctx.workspaceOwnerId,
      company_name: companyName,
      email: body.email != null ? String(body.email) || null : null,
      phone: body.phone != null ? String(body.phone) || null : null,
      address: body.address != null ? String(body.address) || null : null,
      website: body.website != null ? String(body.website) || null : null,
      vat_number: body.vatNumber != null ? String(body.vatNumber) || null : null,
      logo_url: body.logoUrl !== undefined ? (body.logoUrl == null ? null : String(body.logoUrl)) : undefined,
      bank_name: body.bankName != null ? String(body.bankName) || null : null,
      account_name: body.accountName != null ? String(body.accountName) || null : null,
      account_number: body.accountNumber != null ? String(body.accountNumber) || null : null,
      branch_code: body.branchCode != null ? String(body.branchCode) || null : null,
      account_type: body.accountType != null ? String(body.accountType) || null : null,
    };

    if (body.subscriptionPlan !== undefined) payload.subscription_plan = String(body.subscriptionPlan);
    if (body.preferredLocale !== undefined) payload.preferred_locale = String(body.preferredLocale);
    if (body.baseCurrency !== undefined) payload.base_currency = String(body.baseCurrency).toUpperCase();

    const brandingPayload: Record<string, unknown> = {
      ...payload,
      invoice_accent_hex: body.invoiceAccentHex != null ? String(body.invoiceAccentHex) || null : null,
      invoice_header_hex: body.invoiceHeaderHex != null ? String(body.invoiceHeaderHex) || null : null,
      email_template_invoice: body.emailTemplateInvoice != null ? String(body.emailTemplateInvoice) || null : null,
      email_template_reminder: body.emailTemplateReminder != null ? String(body.emailTemplateReminder) || null : null,
    };

    for (const k of Object.keys(brandingPayload)) {
      if (brandingPayload[k] === undefined) delete brandingPayload[k];
    }
    for (const k of Object.keys(payload)) {
      if (payload[k] === undefined) delete payload[k];
    }

    let { data, error }: { data: any; error: any } = await supabase
      .from('company_profiles')
      .upsert(brandingPayload, { onConflict: 'owner_id' })
      .select(SELECT_WITH_BRANDING)
      .single();

    if (error) {
      const msg = String((error as any).message ?? '').toLowerCase();
      if (msg.includes('invoice_accent') || msg.includes('email_template') || msg.includes('column')) {
        const r = await supabase.from('company_profiles').upsert(payload, { onConflict: 'owner_id' }).select(SELECT_BASE).single();
        data = r.data as any;
        error = r.error;
      }
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data: { company: mapProfile(data) } });
  } catch (e: any) {
    const msg = String(e?.message ?? '');
    if (msg.includes('permission')) {
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: msg || 'Failed to save settings.' }, { status: 500 });
  }
}
