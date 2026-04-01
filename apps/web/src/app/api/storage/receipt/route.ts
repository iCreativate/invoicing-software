import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { success: false, error: 'Missing env: SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60 * 30);
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to sign URL');

    const res = NextResponse.redirect(data.signedUrl, 302);
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to sign URL' }, { status: 500 });
  }
}
