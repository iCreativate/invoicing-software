import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { PublicQuoteClient } from './PublicQuoteClient';

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
      total_amount,
      notes,
      client:clients(name),
      items:quote_items(description,quantity,unit_price,line_total)
    `
    )
    .eq('public_share_id', shareId)
    .maybeSingle();

  if (error || !quote) notFound();
  const status = String((quote as any).status ?? '');
  if (status === 'draft' || status === 'cancelled') notFound();

  let companyName = 'Business';
  const ownerId = (quote as any).owner_id ? String((quote as any).owner_id) : null;
  if (ownerId) {
    const { data: profile } = await admin
      .from('company_profiles')
      .select('company_name')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if ((profile as any)?.company_name) companyName = String((profile as any).company_name);
  }

  const items = ((quote as any).items ?? []).map((it: any) => ({
    description: String(it.description ?? ''),
    quantity: Number(it.quantity ?? 0),
    unitPrice: Number(it.unit_price ?? 0),
    lineTotal: Number(it.line_total ?? 0),
  }));

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PublicQuoteClient
        shareId={shareId}
        initial={{
          id: String((quote as any).id),
          quoteNumber: (quote as any).quote_number ? String((quote as any).quote_number) : null,
          status,
          issueDate: String((quote as any).issue_date ?? ''),
          validUntil: String((quote as any).valid_until ?? ''),
          currency: String((quote as any).currency ?? 'ZAR'),
          totalAmount: Number((quote as any).total_amount ?? 0),
          notes: (quote as any).notes != null ? String((quote as any).notes) : null,
          companyName,
          clientName: (quote as any).client?.name ? String((quote as any).client.name) : null,
          items,
        }}
      />
    </div>
  );
}
