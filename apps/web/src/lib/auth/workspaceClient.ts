import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

/** Matches server `getWorkspaceContext` for list queries in the browser. */
export async function getWorkspaceOwnerIdForClient(): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const email = auth.user?.email ?? '';
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
