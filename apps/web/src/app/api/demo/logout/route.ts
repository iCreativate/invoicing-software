import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('ti_demo', '', { path: '/', maxAge: 0 });
  res.cookies.set('ti_demo_ui', '', { path: '/', maxAge: 0 });
  res.cookies.set('ti_supabase_down', '', { path: '/', maxAge: 0 });
  return res;
}
