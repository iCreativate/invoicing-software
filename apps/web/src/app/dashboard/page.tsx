import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/auth/workspace';
import { buildDemoDashboardSummary, emptyDashboardSummary, getDashboardSummary } from '@/lib/dashboard/summary';
import { isMissingRelationError, isTransientDbError, withTimeoutRetry } from '@/lib/demo/server';
import DashboardClient from './DashboardClient';

function isDemoCookieStore(store: Awaited<ReturnType<typeof cookies>>) {
  return (
    store.get('ti_demo')?.value === '1' ||
    store.get('ti_demo_ui')?.value === '1' ||
    store.get('ti_supabase_down')?.value === '1'
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();

  if (isDemoCookieStore(cookieStore)) {
    return <DashboardClient userEmail="demo@timelyinvoices.app" summary={buildDemoDashboardSummary()} />;
  }

  let user: { id: string; email?: string | null } | null = null;
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
    const result = await withTimeoutRetry(() => supabase.auth.getUser(), 12000, 1);
    user = result.data.user;
  } catch {
    redirect('/login?next=/dashboard');
  }

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  try {
    const ws = await getWorkspaceContext(supabase);
    const ownerId = ws?.workspaceOwnerId ?? user.id;
    const summary = await withTimeoutRetry(() => getDashboardSummary(supabase, ownerId), 20000, 1);
    return <DashboardClient userEmail={user.email ?? null} summary={summary} />;
  } catch (err) {
    if (isTransientDbError(err) || isMissingRelationError(err)) {
      return <DashboardClient userEmail={user.email ?? null} summary={emptyDashboardSummary()} />;
    }
    redirect('/login?next=/dashboard');
  }
}
