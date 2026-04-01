import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('ti_demo', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 6, // 6 hours
  });
  return res;
}

