import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { PayNowButton } from '@/components/payments/PayNowButton';
import { subscriptionShowsPoweredBy } from '@/lib/company/subscription';
import { PublicInvoiceViewTracker } from '@/components/invoice/PublicInvoiceViewTracker';

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      `
      id,
      owner_id,
      invoice_number,
      issue_date,
      due_date,
      currency,
      template_id,
      client:clients(name,email,phone,address,company_name,website,company_registration,vat_number),
      items:invoice_items(id,description,quantity,unit_price,tax_rate)
    `
    )
    .eq('public_share_id', shareId)
    .single();

  if (error || !invoice) notFound();

  const ownerId = (invoice as any).owner_id ? String((invoice as any).owner_id) : null;

  let companyRow: any = null;
  if (ownerId) {
    const full = await supabase
      .from('company_profiles')
      .select(
        'company_name,logo_url,email,phone,address,website,vat_number,bank_name,account_name,account_number,branch_code,account_type,subscription_plan'
      )
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (full.error) {
      const msg = String((full.error as any).message ?? '');
      if (msg.includes('bank_name') || msg.includes('account_name') || msg.includes('branch_code')) {
        const fb = await supabase
          .from('company_profiles')
          .select('company_name,logo_url,email,phone,address,website,vat_number,subscription_plan')
          .eq('owner_id', ownerId)
          .maybeSingle();
        companyRow = fb.error ? null : fb.data;
      } else if (msg.includes('subscription_plan')) {
        const fb = await supabase
          .from('company_profiles')
          .select('company_name,logo_url,email,phone,address,website,vat_number,bank_name,account_name,account_number,branch_code,account_type')
          .eq('owner_id', ownerId)
          .maybeSingle();
        companyRow = fb.data ?? null;
      } else {
        companyRow = full.data ?? null;
      }
    } else {
      companyRow = full.data ?? null;
    }
  }

  const poweredBy = subscriptionShowsPoweredBy((companyRow as any)?.subscription_plan ?? null);

  const draft = {
    clientId: '',
    invoiceNumber: (invoice as any).invoice_number ? String((invoice as any).invoice_number) : null,
    issueDate: String((invoice as any).issue_date ?? ''),
    dueDate: String((invoice as any).due_date ?? ''),
    currency: String((invoice as any).currency ?? 'ZAR'),
    template: (invoice as any).template_id ? String((invoice as any).template_id) : ('modern' as const),
    items: ((invoice as any).items ?? []).map((it: any) => ({
      id: String(it.id),
      description: String(it.description ?? ''),
      quantity: Number(it.quantity ?? 0),
      unitPrice: Number(it.unit_price ?? 0),
      vatRate: Number(it.tax_rate ?? 15),
    })),
  };

  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] p-4 sm:p-10">
      <PublicInvoiceViewTracker shareId={shareId} />
      <div className="mx-auto max-w-4xl motion-safe:animate-[ti-fade-up_0.45s_ease-out_both]">
        <div className="mb-4 flex items-center justify-end">
          <PayNowButton invoiceId={String((invoice as any).id)} />
        </div>
        <InvoicePreview
          companyName={String((companyRow as any)?.company_name ?? 'TimelyInvoices')}
          companyLogoPath={(companyRow as any)?.logo_url ? String((companyRow as any).logo_url) : null}
          companyDetails={
            companyRow
              ? {
                  email: (companyRow as any).email ?? null,
                  phone: (companyRow as any).phone ?? null,
                  address: (companyRow as any).address ?? null,
                  website: (companyRow as any).website ?? null,
                  vatNumber: (companyRow as any).vat_number ?? null,
                  bankName: (companyRow as any).bank_name ?? null,
                  accountName: (companyRow as any).account_name ?? null,
                  accountNumber: (companyRow as any).account_number ?? null,
                  branchCode: (companyRow as any).branch_code ?? null,
                  accountType: (companyRow as any).account_type ?? null,
                }
              : null
          }
          draft={draft as any}
          client={{
            name: (invoice as any).client?.name ?? '—',
            email: (invoice as any).client?.email ?? null,
            phone: (invoice as any).client?.phone ?? null,
            address: (invoice as any).client?.address ?? null,
            companyName: (invoice as any).client?.company_name ?? null,
            website: (invoice as any).client?.website ?? null,
            companyRegistration: (invoice as any).client?.company_registration ?? null,
            vatNumber: (invoice as any).client?.vat_number ?? null,
          }}
          showPoweredBy={poweredBy}
        />
      </div>
    </div>
  );
}
