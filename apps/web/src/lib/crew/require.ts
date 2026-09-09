import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isCrewEmail } from '@/lib/crew/access';

export type CrewContext = {
  userId: string;
  email: string;
  admin: SupabaseClient;
};

/**
 * Require signed-in user whose email is in TIMELY_CREW_EMAILS.
 * Returns 401 / 403 JSON responses on failure.
 */
export async function requireCrew(
  supabase: SupabaseClient
): Promise<{ ctx: CrewContext } | { error: NextResponse }> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    return { error: NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 }) };
  }
  const email = String(data.user.email ?? '').trim();
  if (!isCrewEmail(email)) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 }) };
  }
  let admin: SupabaseClient;
  try {
    admin = createSupabaseAdminClient();
  } catch (e: any) {
    return {
      error: NextResponse.json(
        { success: false, error: e?.message ?? 'Admin client unavailable' },
        { status: 503 }
      ),
    };
  }
  return { ctx: { userId: data.user.id, email, admin } };
}
