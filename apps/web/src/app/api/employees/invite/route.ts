import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { assertCanManageTeam, getWorkspaceContext } from '@/lib/auth/workspace';

let ResendClient: any = null;
async function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!ResendClient) {
    const mod = await import('resend');
    ResendClient = mod.Resend;
  }
  return new ResendClient(process.env.RESEND_API_KEY);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim();
    const name = body.name ? String(body.name).trim() : '';
    const role = String(body.role ?? 'Employee').trim() || 'Employee';
    const permissionRaw = String(body.permission ?? 'member').toLowerCase();
    const permission = ['owner', 'admin', 'billing', 'member', 'viewer'].includes(permissionRaw) ? permissionRaw : 'member';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }

    const ws = await getWorkspaceContext(supabase);
    if (!ws) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    try {
      assertCanManageTeam(ws);
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message ?? 'Forbidden' }, { status: 403 });
    }

    const displayName = name || email.split('@')[0] || 'Employee';

    let row: { id: string } | null = null;
    let error: any = null;
    const ins = await supabase
      .from('employees')
      .insert({
        owner_id: ws.workspaceOwnerId,
        name: displayName,
        email,
        role,
        status: 'invited',
        invited_at: new Date().toISOString(),
        permission,
      })
      .select('id')
      .single();
    row = ins.data as any;
    error = ins.error;
    if (error?.message?.includes('permission')) {
      const retry = await supabase
        .from('employees')
        .insert({
          owner_id: ws.workspaceOwnerId,
          name: displayName,
          email,
          role,
          status: 'invited',
          invited_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      row = retry.data as any;
      error = retry.error;
    }
    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const inviteInfo = `You've been invited to TimelyInvoices as ${role}.`;
    const loginUrl = `${appUrl}/login`;

    const resend = await getResend();
    if (!resend) {
      return NextResponse.json(
        { success: false, error: 'Email not configured (missing RESEND_API_KEY). Employee record created.' },
        { status: 500 }
      );
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TimelyInvoices <invoices@timelyinvoices.app>',
      to: [email],
      subject: 'You’ve been invited to TimelyInvoices',
      html: `<p>Hi ${displayName},</p><p>${inviteInfo}</p><p><a href="${loginUrl}">Sign in</a> to get started.</p>`,
    });

    return NextResponse.json({ success: true, data: { id: String((row as any).id) } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Invite failed' }, { status: 500 });
  }
}

