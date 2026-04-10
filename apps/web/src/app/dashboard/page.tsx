import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { buildDemoDashboardSummary, getDashboardSummary } from '@/lib/dashboard/summary';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const demo = cookieStore.get('ti_demo')?.value === '1';

  if (demo) {
    return <DashboardClient userEmail="demo@timelyinvoices.app" summary={buildDemoDashboardSummary()} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ws = await getWorkspaceContext(supabase);
  const ownerId = ws?.workspaceOwnerId ?? user?.id ?? null;

  const summary = await getDashboardSummary(supabase, ownerId);

  return <DashboardClient userEmail={user?.email ?? null} summary={summary} />;
}
