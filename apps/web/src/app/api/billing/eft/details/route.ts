import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { getEftBankDetailsFromEnv, buildEftReference, eftAmountCentsForPlan } from '@/lib/billing/eft';
import { PLANS } from '@/lib/billing/entitlements';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const bank = getEftBankDetailsFromEnv();
    const reference = buildEftReference(ctx.workspaceOwnerId);

    const { data: pending } = await supabase
      .from('eft_payment_claims')
      .select('id,plan,amount_cents,reference,status,created_at,note')
      .eq('owner_id', ctx.workspaceOwnerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        bank: {
          bankName: bank.bankName || null,
          accountNameDisplay: bank.accountNameDisplay,
          accountNumber: bank.accountNumber || null,
          branchCode: bank.branchCode || null,
          accountType: bank.accountType || null,
          configured: bank.configured,
        },
        reference,
        plans: {
          pro: { amountZar: PLANS.pro.priceZarMonthly, amountCents: eftAmountCentsForPlan('pro') },
          business: {
            amountZar: PLANS.business.priceZarMonthly,
            amountCents: eftAmountCentsForPlan('business'),
          },
        },
        pendingClaims: pending ?? [],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to load EFT details' }, { status: 500 });
  }
}
