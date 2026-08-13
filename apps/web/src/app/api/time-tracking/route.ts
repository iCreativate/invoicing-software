import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import type { TimeTrackingApiData } from '@/features/time-tracking/types';
import { demoSuccessResponse } from '@/lib/demo/apiGate';

export async function GET(request: Request) {
  try {
    const planned: TimeTrackingApiData = {
      moduleStatus: 'planned',
      headline: 'Timers & billable hours',
      description:
        'Track time against clients and projects, then convert entries to invoice line items. This module is planned; your data and auth stay on the existing workspace.',
      entries: [],
    };
    const demo = demoSuccessResponse(request, planned);
    if (demo) return demo;

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: planned });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load time tracking.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
