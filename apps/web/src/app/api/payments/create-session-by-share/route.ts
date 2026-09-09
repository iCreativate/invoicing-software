import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasEntitlement } from '@/lib/billing/entitlements';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import {
  buildProviderRedirect,
  paymentMethodForProvider,
} from '@/lib/payments/onlineSession';

/**
 * Unauthenticated Pay Now for public invoice / portal pages.
 * Auth is the invoice public_share_id only — never load by internal UUID alone.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const shareId = String(body.shareId ?? body.publicShareId ?? '').trim();
    const provider = String(body.provider ?? 'payfast');
    // Optional future portal/share token — accepted but not required yet.
    const _token = body.token != null ? String(body.token) : null;
    void _token;

    if (!shareId) {
      return NextResponse.json({ success: false, error: 'Missing shareId' }, { status: 400 });
    }

    if (provider === 'ozow') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ozow Instant EFT not fully implemented yet (needs merchant credentials + hash spec).',
        },
        { status: 501 }
      );
    }

    let admin;
    try {
      admin = createSupabaseAdminClient();
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: e?.message ?? 'Payment service unavailable.' },
        { status: 503 }
      );
    }

    const rl = await checkRateLimit({
      key: `payments:share-session:${shareId}`,
      limit: 30,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const { data: invoice, error: invErr } = await admin
      .from('invoices')
      .select(
        'id,owner_id,invoice_number,status,total_amount,balance_amount,currency,public_share_id,client:clients(email,name)'
      )
      .eq('public_share_id', shareId)
      .maybeSingle();

    if (invErr || !invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const status = String((invoice as any).status ?? '').toLowerCase();
    if (status === 'draft' || status === 'cancelled') {
      return NextResponse.json({ success: false, error: 'Invoice is not payable.' }, { status: 400 });
    }

    const ownerId = String((invoice as any).owner_id ?? '');
    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const { data: profile } = await admin
      .from('company_profiles')
      .select('subscription_plan')
      .eq('owner_id', ownerId)
      .maybeSingle();
    const plan = (profile as { subscription_plan?: string } | null)?.subscription_plan;
    if (!hasEntitlement(plan, 'payment_links')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Online payment is not enabled for this business.',
          code: 'entitlement_payment_links',
        },
        { status: 402 }
      );
    }

    const amount = Number((invoice as any).balance_amount ?? (invoice as any).total_amount ?? 0);
    const currency = String((invoice as any).currency ?? 'ZAR');
    const invoiceId = String((invoice as any).id);

    if (!(amount > 0) || status === 'paid') {
      return NextResponse.json({ success: false, error: 'Invoice has no outstanding balance.' }, { status: 400 });
    }
    if (currency !== 'ZAR') {
      return NextResponse.json({ success: false, error: 'Online payments currently support ZAR only.' }, { status: 400 });
    }

    const { data: sessionRow, error: sessErr } = await admin
      .from('payment_sessions')
      .insert({
        invoice_id: invoiceId,
        provider,
        method: paymentMethodForProvider(provider),
        amount,
        currency,
        status: 'created',
        meta: {
          invoiceNumber: (invoice as any).invoice_number ?? null,
          publicShareId: shareId,
          source: 'public_share',
        },
      })
      .select('id')
      .single();

    if (sessErr) {
      return NextResponse.json({ success: false, error: sessErr.message }, { status: 500 });
    }

    const sessionId = String((sessionRow as any).id);
    const built = await buildProviderRedirect({
      supabase: admin,
      sessionId,
      provider,
      amount,
      invoiceNumber: (invoice as any).invoice_number ? String((invoice as any).invoice_number) : null,
      clientEmail: (invoice as any)?.client?.email ? String((invoice as any).client.email) : null,
      publicShareId: shareId,
    });

    if (!built.ok) {
      return NextResponse.json({ success: false, error: built.error }, { status: built.status });
    }

    return NextResponse.json({ success: true, data: { sessionId, redirectUrl: built.redirectUrl } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Failed to create payment session.' },
      { status: 500 }
    );
  }
}
