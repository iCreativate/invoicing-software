import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

function normEmail(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

/**
 * GoTrue "Confirm email" is on by default, but this project has no Auth SMTP.
 * After signUp (or a blocked sign-in), confirm the user with the service role
 * so they can enter the app. Only recently created, still-unconfirmed accounts.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown; userId?: unknown } | null;
    const email = normEmail(body?.email);
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });
    }

    const rl = await checkRateLimit({
      key: `auth:confirm-signup:${email}`,
      limit: 8,
      windowSec: 3600,
    });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

    const admin = createSupabaseAdminClient();

    let id = userId;
    if (id) {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || !data.user) {
        return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
      }
      if (normEmail(data.user.email) !== email) {
        return NextResponse.json({ ok: false, error: 'Email does not match.' }, { status: 400 });
      }
    } else {
      id = (await findUserIdByEmail(admin, email)) ?? '';
      if (!id) {
        return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
      }
    }

    const { data: fresh, error: getErr } = await admin.auth.admin.getUserById(id);
    if (getErr || !fresh.user) {
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }

    if (fresh.user.email_confirmed_at) {
      return NextResponse.json({ ok: true, already: true });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(id, { email_confirm: true });
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Could not confirm account.';
    const missing = message.includes('Missing env') || message.includes('SERVICE_ROLE');
    return NextResponse.json(
      {
        ok: false,
        error: missing
          ? 'Server is missing SUPABASE_SERVICE_ROLE_KEY, so the account cannot be confirmed without email.'
          : message,
      },
      { status: missing ? 503 : 500 }
    );
  }
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  email: string
): Promise<string | null> {
  for (let page = 1; page <= 8; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => normEmail(u.email) === email);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}
