import { NextResponse } from 'next/server';
import { requestIsDemo } from '@/lib/demo/server';

/**
 * Short-circuit list APIs in cookie-demo mode.
 * Pass `envelopeKey` when the real route returns `{ data: { [key]: [] } }`.
 * Omit it when the real route returns `{ data: [] }`.
 */
export function demoListResponse(request: Request, envelopeKey?: string): NextResponse | null {
  if (!requestIsDemo(request)) return null;
  const data = envelopeKey ? { [envelopeKey]: [] } : [];
  return NextResponse.json({ success: true, data, demo: true });
}

/** Return populated sample JSON for GET handlers in cookie-demo mode. */
export function demoSuccessResponse(request: Request, data: unknown, extra: Record<string, unknown> = {}): NextResponse | null {
  if (!requestIsDemo(request)) return null;
  return NextResponse.json({ success: true, data, demo: true, ...extra });
}

export function demoNotAvailableResponse(request: Request): NextResponse | null {
  if (!requestIsDemo(request)) return null;
  return NextResponse.json(
    { success: false, error: 'Sample mode is view-only. Connect a live Supabase project to create or edit records.', demo: true },
    { status: 503 }
  );
}
