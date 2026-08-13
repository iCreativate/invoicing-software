import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';
import { isDemoUiActive } from '@/lib/demo/accounts';

/** Matches server `getWorkspaceContext` for list queries in the browser. */
export async function getWorkspaceOwnerIdForClient(): Promise<string> {
  if (isDemoUiActive()) return 'demo-owner';

  const supabase = createSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user;
  const user = sessionUser ?? (await getBrowserUserSafe());
  const uid = user?.id;
  if (!uid) throw new Error('Not signed in.');

  const email = user.email ?? '';
  const { data: emp, error } = await supabase.from('employees').select('owner_id').eq('email', email).maybeSingle();

  if (error) {
    const msg = String((error as any).message ?? '').toLowerCase();
    if (!msg.includes('permission') && !msg.includes('column') && !msg.includes('does not exist')) {
      throw error;
    }
  }

  const oid = (emp as any)?.owner_id;
  if (oid) return String(oid);
  return uid;
}
