import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

const PLACEHOLDER_NAMES = new Set(['', 'my business', 'my company', 'untitled']);

function isPlaceholderCompanyName(name: string): boolean {
  return PLACEHOLDER_NAMES.has(name.trim().toLowerCase());
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true, skipped: 'no-session' });

    const m = user.user_metadata ?? {};
    const companyName = str(m.company_name);
    const phone = str(m.company_phone);
    const website = str(m.company_website);

    if (!companyName && !phone && !website) {
      return NextResponse.json({ ok: true, skipped: 'no-metadata' });
    }

    const { data: row, error: selErr } = await supabase
      .from('company_profiles')
      .select('id,company_name,phone,website')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (selErr) {
      const msg = String((selErr as { message?: string }).message ?? '');
      if (msg.includes('does not exist') || msg.includes('column')) {
        return NextResponse.json({ ok: true, skipped: 'schema' });
      }
      throw selErr;
    }

    const email = user.email ?? null;

    if (!row) {
      const name = companyName || 'My business';
      const { error: insErr } = await supabase.from('company_profiles').insert({
        owner_id: user.id,
        company_name: name,
        email,
        phone: phone || null,
        website: website || null,
      });
      if (insErr) throw insErr;
      return NextResponse.json({ ok: true, applied: 'insert' });
    }

    const currentName = str((row as { company_name?: string }).company_name);
    const patch: Record<string, string | null> = {};

    if (companyName && isPlaceholderCompanyName(currentName)) {
      patch.company_name = companyName;
    }
    if (phone && !str((row as { phone?: string }).phone)) {
      patch.phone = phone;
    }
    if (website && !str((row as { website?: string }).website)) {
      patch.website = website;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true, skipped: 'nothing-to-merge' });
    }

    const { error: updErr } = await supabase.from('company_profiles').update(patch).eq('owner_id', user.id);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, applied: 'update' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'apply failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
