import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { assertCanEdit, assertRowOwnedByWorkspace, getWorkspaceContext } from '@/lib/auth/workspace';
import { canManageBilling } from '@/lib/permissions/team';
import { hasEntitlement } from '@/lib/billing/entitlements';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import {
  buildProviderRedirect,
  ensureInvoicePublicShareId,
  paymentMethodForProvider,
} from '@/lib/payments/onlineSession';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceId = String(body.invoiceId ?? '');
    const provider = String(body.provider ?? 'payfast');

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Missing invoiceId' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }
    if (!canManageBilling(ctx.permission)) {
      try {
        assertCanEdit(ctx);
      } catch {
        return NextResponse.json({ success: false, error: 'Not allowed to create payment sessions.' }, { status: 403 });
      }
    }

    const rl = await checkRateLimit({
      key: `payments:session:${ctx.workspaceOwnerId}`,
      limit: 40,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const { data: profile } = await supabase
      .from('company_profiles')
      .select('subscription_plan')
      .eq('owner_id', ctx.workspaceOwnerId)
      .maybeSingle();
    const plan = (profile as { subscription_plan?: string } | null)?.subscription_plan;
    if (!hasEntitlement(plan, 'payment_links')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Online payment links require Pro or Business. Upgrade under Billing.',
          code: 'entitlement_payment_links',
        },
        { status: 402 }
      );
    }

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select(
        'id,owner_id,invoice_number,total_amount,balance_amount,currency,public_share_id,client:clients(email,name)'
      )
      .eq('id', invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ success: false, error: invErr?.message ?? 'Invoice not found' }, { status: 404 });
    }

    try {
      assertRowOwnedByWorkspace((invoice as any).owner_id, ctx);
    } catch {
      return NextResponse.json({ success: false, error: 'Not allowed for this workspace.' }, { status: 403 });
    }

    const amount = Number((invoice as any).balance_amount ?? (invoice as any).total_amount ?? 0);
    const currency = String((invoice as any).currency ?? 'ZAR');

    if (!(amount > 0)) {
      return NextResponse.json({ success: false, error: 'Invoice has no outstanding balance.' }, { status: 400 });
    }
    if (currency !== 'ZAR') {
      return NextResponse.json({ success: false, error: 'Online payments currently support ZAR only.' }, { status: 400 });
    }

    const publicShareId = await ensureInvoicePublicShareId(
      supabase,
      invoiceId,
      (invoice as any).public_share_id,
      ctx.workspaceOwnerId
    );

    const { data: sessionRow, error: sessErr } = await supabase
      .from('payment_sessions')
      .insert({
        invoice_id: invoiceId,
        provider,
        method: paymentMethodForProvider(provider),
        amount,
        currency,
        status: 'created',
        meta: { invoiceNumber: (invoice as any).invoice_number ?? null, publicShareId },
      })
      .select('id')
      .single();

    if (sessErr) {
      return NextResponse.json({ success: false, error: sessErr.message }, { status: 500 });
    }

    const sessionId = String((sessionRow as any).id);
    const built = await buildProviderRedirect({
      supabase,
      sessionId,
      provider,
      amount,
      invoiceNumber: (invoice as any).invoice_number ? String((invoice as any).invoice_number) : null,
      clientEmail: (invoice as any)?.client?.email ? String((invoice as any).client.email) : null,
      publicShareId,
    });

    if (!built.ok) {
      return NextResponse.json({ success: false, error: built.error }, { status: built.status });
    }

    return NextResponse.json({ success: true, data: { sessionId, redirectUrl: built.redirectUrl } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to create payment session.' }, { status: 500 });
  }
}
