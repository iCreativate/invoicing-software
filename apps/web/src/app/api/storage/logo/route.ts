import { NextResponse } from 'next/server';
import { guessLogoContentType, isStorageLogoObjectPath, resolveLogosObjectKey } from '@/lib/company/logoUrl';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = String(searchParams.get('path') ?? '');
    const path = resolveLogosObjectKey(raw) ?? raw.trim().replace(/^\/+/, '');
    if (!path || !isStorageLogoObjectPath(path)) {
      return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
    }

    // Use the caller's session (no service role key required). Storage policies enforce access.
    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }

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

