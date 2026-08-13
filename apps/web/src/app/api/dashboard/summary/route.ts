import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { buildDemoDashboardSummary, getDashboardSummary } from '@/lib/dashboard/summary';
import { demoSuccessResponse } from '@/lib/demo/apiGate';

export async function GET(request: Request) {
  try {
    const demo = demoSuccessResponse(request, buildDemoDashboardSummary());
    if (demo) return demo;

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });
    }

    const data = await getDashboardSummary(supabase, ctx.workspaceOwnerId);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to load dashboard summary.' }, { status: 500 });
  }
}
