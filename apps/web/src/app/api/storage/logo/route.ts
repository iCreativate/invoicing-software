import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guessLogoContentType, isStorageLogoObjectPath } from '@/lib/company/logoUrl';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = String(searchParams.get('path') ?? '');
    if (!path || !isStorageLogoObjectPath(path)) {
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
    // Stream bytes through our origin so <img src> works reliably (302 redirects to signed URLs often break previews).
    const { data: blob, error } = await supabase.storage.from('logos').download(path);
    if (error) throw error;
    if (!blob) throw new Error('Empty response from storage');

    const buf = await blob.arrayBuffer();
    const contentType = blob.type || guessLogoContentType(path);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store, max-age=0',
        Pragma: 'no-cache',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to load logo' }, { status: 500 });
  }
}

