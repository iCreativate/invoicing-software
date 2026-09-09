import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireCrew } from '@/lib/crew/require';
import { writeCrewAudit } from '@/lib/crew/audit';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient(request);
    const gate = await requireCrew(supabase);
    if ('error' in gate) return gate.error;
    const { ctx } = gate;
    const admin = ctx.admin;

    const body = await request.json().catch(() => null);
    const note = body?.note != null ? String(body.note).slice(0, 500) : null;

    const { data: claim, error: claimErr } = await admin
      .from('eft_payment_claims')
      .select('id,owner_id,plan,reference,status')
      .eq('id', id)
      .maybeSingle();
    if (claimErr) throw claimErr;
    if (!claim) return NextResponse.json({ success: false, error: 'Claim not found.' }, { status: 404 });
    if (String((claim as any).status) !== 'pending') {
      return NextResponse.json({ success: false, error: 'Claim is not pending.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { error: updErr } = await admin
      .from('eft_payment_claims')
      .update({
        status: 'rejected',
        reviewed_at: now,
        reviewed_by: ctx.userId,
        note,
      })
      .eq('id', id)
      .eq('status', 'pending');
    if (updErr) throw updErr;

    const ownerId = String((claim as any).owner_id);

    await admin.from('notifications').insert({
      owner_id: ownerId,
      title: 'EFT claim not confirmed',
      body: note
        ? `We could not confirm your EFT (${note}). Contact support if you already paid.`
        : 'We could not confirm your EFT. Contact support if you already paid.',
      href: '/settings/billing',
      entity_type: 'billing',
      entity_id: ownerId,
    });

    await writeCrewAudit(admin, {
      actorUserId: ctx.userId,
      actorEmail: ctx.email,
      action: 'eft.reject',
      targetOwnerId: ownerId,
      entityType: 'eft_payment_claim',
      entityId: id,
      meta: { plan: (claim as any).plan, reference: (claim as any).reference, note },
    });

    return NextResponse.json({ success: true, data: { id, ownerId } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Reject failed' }, { status: 500 });
  }
}
