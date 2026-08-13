import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { assertCanEdit, assertRowOwnedByWorkspace, getWorkspaceContext } from '@/lib/auth/workspace';

function isAllowedReceiptPath(path: string) {
  return /^[0-9a-fA-F-]{36}\/receipts\/[0-9a-fA-F-]+\.(png|jpg|jpeg|webp|pdf)$/i.test(path);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = String(searchParams.get('path') ?? '');
    if (!path || !isAllowedReceiptPath(path)) {
      return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }

    const ownerFromPath = path.split('/')[0] ?? '';
    assertRowOwnedByWorkspace(ownerFromPath, ctx);

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from('receipts').createSignedUrl(path, 60 * 30);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to sign URL');

    const res = NextResponse.redirect(data.signedUrl, 302);
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (e: any) {
    const msg = String(e?.message ?? '');
    if (msg.includes('Not allowed') || msg.includes('permission')) {
      return NextResponse.json({ success: false, error: msg }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: msg || 'Failed to sign URL' }, { status: 500 });
  }
}
