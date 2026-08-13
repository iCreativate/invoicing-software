import { NextResponse } from 'next/server';

function demoCookieOpts() {
  return {
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 6, // 6 hours
  };
}

function clearSupabaseAuthCookies(request: Request, res: NextResponse) {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const name = part.trim().split('=')[0];
    if (!name) continue;
    if (name.startsWith('sb-') || name.toLowerCase().includes('supabase')) {
      res.cookies.set(name, '', { path: '/', maxAge: 0 });
    }
  }
}

function applyDemoCookies(request: Request, res: NextResponse) {
  const opts = demoCookieOpts();
  clearSupabaseAuthCookies(request, res);
  res.cookies.set('ti_demo', '1', { ...opts, httpOnly: true });
  res.cookies.set('ti_demo_ui', '1', { ...opts, httpOnly: false });
  res.cookies.set('ti_supabase_down', '1', { ...opts, httpOnly: false });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') || '/dashboard';
  const dest = new URL(next.startsWith('/') ? next : '/dashboard', url.origin);
  const res = NextResponse.redirect(dest);
  applyDemoCookies(request, res);
  return res;
}

export async function POST(request: Request) {
  const res = NextResponse.json({ success: true });
  applyDemoCookies(request, res);
  return res;
}
