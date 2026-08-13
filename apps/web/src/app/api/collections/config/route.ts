import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { ensureDefaultCollectionSequence } from '@/lib/collections/runner';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasEntitlement } from '@/lib/billing/entitlements';
import { demoSuccessResponse } from '@/lib/demo/apiGate';
import { demoCollectionsConfig } from '@/lib/demo/fixtures';

export async function GET(request: Request) {
  try {
    const demo = demoSuccessResponse(request, demoCollectionsConfig());
    if (demo) return demo;

    const supabase = await createSupabaseServerClient(request);
    const ctx = await getWorkspaceContext(supabase);
    if (!ctx) return NextResponse.json({ success: false, error: 'Not signed in.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('company_profiles')
      .select('subscription_plan')
      .eq('owner_id', ctx.workspaceOwnerId)
      .maybeSingle();

    const plan = (profile as { subscription_plan?: string } | null)?.subscription_plan;
    const automationEnabled = hasEntitlement(plan, 'collections_sequences');

    let sequenceId: string | null = null;
    let steps: { id: string; offsetDays: number; channel: string; templateKey: string }[] = [];

    if (automationEnabled) {
      try {
        const admin = createSupabaseAdminClient();
        sequenceId = await ensureDefaultCollectionSequence(admin, ctx.workspaceOwnerId);
        const { data: stepRows } = await admin
          .from('collection_sequence_steps')
          .select('id,offset_days,channel,template_key')
          .eq('sequence_id', sequenceId)
          .order('sort_order', { ascending: true });
        steps = (stepRows ?? []).map((s: any) => ({
          id: String(s.id),
          offsetDays: Number(s.offset_days),
          channel: String(s.channel ?? 'email'),
          templateKey: String(s.template_key ?? ''),
        }));
      } catch {
        // table may be missing
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        automationEnabled,
        sequenceId,
        steps,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Failed to load collections config.' }, { status: 500 });
  }
}
