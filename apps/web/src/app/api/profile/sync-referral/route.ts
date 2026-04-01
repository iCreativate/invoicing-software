import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true, skipped: 'no-session' });

    const refRaw = user.user_metadata?.referrer_code ?? user.user_metadata?.referral_code;
    const referrerCode = typeof refRaw === 'string' ? refRaw.trim().toUpperCase() : '';
    if (!referrerCode) return NextResponse.json({ ok: true, skipped: 'no-code' });

    const { data: mine, error: mineErr } = await supabase
      .from('company_profiles')
      .select('id,referred_by_code')
      .eq('owner_id', user.id)
      .maybeSingle();
    if (mineErr) {
      const msg = String((mineErr as any).message ?? '');
      if (msg.includes('referred_by_code') || msg.includes('column')) {
        return NextResponse.json({ ok: true, skipped: 'schema' });
      }
      throw mineErr;
    }

    if ((mine as any)?.referred_by_code) return NextResponse.json({ ok: true, skipped: 'already' });

    const { data: referrer, error: refErr } = await supabase
      .from('company_profiles')
      .select('owner_id,referral_code')
      .eq('referral_code', referrerCode)
      .maybeSingle();
    if (refErr) throw refErr;
    const referrerOwnerId = (referrer as any)?.owner_id ? String((referrer as any).owner_id) : null;
    if (!referrerOwnerId || referrerOwnerId === user.id) {
      return NextResponse.json({ ok: true, skipped: 'invalid-referrer' });
    }

    const { error: updErr } = await supabase
      .from('company_profiles')
      .update({ referred_by_code: referrerCode })
      .eq('owner_id', user.id);
    if (updErr) {
      const msg = String((updErr as any).message ?? '');
      if (msg.includes('referred_by_code') || msg.includes('column')) {
        return NextResponse.json({ ok: true, skipped: 'schema' });
      }
      throw updErr;
    }

    const { data: existingReward } = await supabase
      .from('referral_rewards')
      .select('id')
      .eq('owner_id', referrerOwnerId)
      .filter('meta->>referred_user_id', 'eq', user.id)
      .maybeSingle();

    if (!existingReward) {
      const { error: rewErr } = await supabase.from('referral_rewards').insert({
        owner_id: referrerOwnerId,
        amount: 100,
        currency: 'ZAR',
        reason: 'Referral reward — new signup',
        meta: { referred_user_id: user.id },
      });
      if (rewErr) {
        const msg = String((rewErr as any).message ?? '');
        if (!msg.includes('referral_rewards') && !msg.includes('column')) throw rewErr;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'sync failed' }, { status: 500 });
  }
}
