import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { PublicQuoteClient } from './PublicQuoteClient';
import { subscriptionShowsPoweredBy } from '@/lib/company/subscription';
import { mapCompanyRowToPreviewDetails } from '@/features/company/previewDetails';
import { headers } from 'next/headers';

export default async function PublicQuotePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    notFound();
  }

  const { data: quote, error } = await admin
    .from('quotes')
    .select(
      `
      id,
      owner_id,
      quote_number,
      status,
      issue_date,
      valid_until,
      currency,
      notes,
      client:clients(name),
      items:quote_items(id,description,quantity,unit_price,tax_rate)
    `
    )
    .eq('public_share_id', shareId)
    .maybeSingle();

  if (error || !quote) notFound();
  const status = String((quote as any).status ?? '');
  if (status === 'draft' || status === 'cancelled') notFound();

  const ownerId = (quote as any).owner_id ? String((quote as any).owner_id) : null;
  let companyRow: Record<string, unknown> | null = null;
  if (ownerId) {
    const full = await admin
      .from('company_profiles')
      .select(
        'company_name,logo_url,email,phone,address,website,vat_number,bank_name,account_name,account_number,branch_code,account_type,subscription_plan'
      )
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (full.error) {
      const msg = String((full.error as any).message ?? '');
      if (msg.includes('bank_name') || msg.includes('account_name') || msg.includes('branch_code')) {
        const fb = await admin
          .from('company_profiles')
          .select('company_name,logo_url,email,phone,address,website,vat_number,subscription_plan')
          .eq('owner_id', ownerId)
          .maybeSingle();
        companyRow = (fb.data as Record<string, unknown> | null) ?? null;
      } else if (msg.includes('subscription_plan')) {
        const fb = await admin
          .from('company_profiles')
          .select('company_name,logo_url,email,phone,address,website,vat_number,bank_name,account_name,account_number,branch_code,account_type')
          .eq('owner_id', ownerId)
          .maybeSingle();
        companyRow = (fb.data as Record<string, unknown> | null) ?? null;
      } else {
        companyRow = (full.data as Record<string, unknown> | null) ?? null;
      }
    } else {
      companyRow = (full.data as Record<string, unknown> | null) ?? null;
    }
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const origin = host ? `${proto}://${host}` : null;
  const shareUrl = origin ? new URL(`/quote/${shareId}`, origin).toString() : `/quote/${shareId}`;

  const draft = {
    clientId: '',
    invoiceNumber: (quote as any).quote_number ? String((quote as any).quote_number) : null,
    issueDate: String((quote as any).issue_date ?? ''),
    dueDate: String((quote as any).valid_until ?? ''),
    currency: String((quote as any).currency ?? 'ZAR'),
    template: 'modern' as const,
    items: ((quote as any).items ?? []).map((it: any) => ({
      id: String(it.id),
      description: String(it.description ?? ''),
      quantity: Number(it.quantity ?? 0),
      unitPrice: Number(it.unit_price ?? 0),
      vatRate: Number(it.tax_rate ?? 15),
    })),
    notes: (quote as any).notes != null ? String((quote as any).notes) : undefined,
  };

  return (
    <PublicQuoteClient
      shareId={shareId}
      initial={{
        id: String((quote as any).id),
        quoteNumber: (quote as any).quote_number ? String((quote as any).quote_number) : null,
        status,
        issueDate: String((quote as any).issue_date ?? ''),
        validUntil: String((quote as any).valid_until ?? ''),
        currency: String((quote as any).currency ?? 'ZAR'),
        notes: (quote as any).notes != null ? String((quote as any).notes) : null,
        companyName: companyRow?.company_name != null ? String(companyRow.company_name) : 'Business',
        companyLogoPath: companyRow?.logo_url != null ? String(companyRow.logo_url) : null,
        companyDetails: mapCompanyRowToPreviewDetails(companyRow),
        showPoweredBy: subscriptionShowsPoweredBy((companyRow?.subscription_plan as string | null | undefined) ?? null),
        shareUrl,
        clientName: (quote as any).client?.name ? String((quote as any).client.name) : null,
        draft,
      }}
    />
  );
}
