import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getWorkspaceOwnerIdForClient } from '@/lib/auth/workspaceClient';
import type { EmployeeListItem, EmployeeStatus } from './types';

function coerceStatus(v: unknown): EmployeeStatus {
  const s = String(v ?? 'invited').toLowerCase();
  return s === 'active' || s === 'inactive' || s === 'invited' ? (s as EmployeeStatus) : 'invited';
}

export async function fetchEmployeesList(): Promise<EmployeeListItem[]> {
  const supabase = createSupabaseBrowserClient();
  const ownerId = await getWorkspaceOwnerIdForClient();

  let data: any[] | null = null;
  let error: any = null;
  const full = await supabase
    .from('employees')
    .select('id,name,email,role,status,invited_at,permission')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  data = full.data as any;
  error = full.error;
  if (error && String(error.message ?? '').toLowerCase().includes('permission')) {
    const fb = await supabase
      .from('employees')
      .select('id,name,email,role,status,invited_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    data = fb.data as any;
    error = fb.error;
  }
  if (error) throw error;
  return (data ?? []).map((e: any) => ({
    id: String(e.id),
    name: String(e.name ?? ''),
    email: String(e.email ?? ''),
    role: String(e.role ?? 'Employee'),
    status: coerceStatus(e.status),
    invitedAt: e.invited_at ? String(e.invited_at) : null,
    permission: e.permission != null ? String(e.permission) : 'member',
  }));
}

export async function inviteEmployee(input: { name?: string; email: string; role: string; permission?: string }) {
  const res = await fetch('/api/employees/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.error ?? 'Invite failed');
  return json.data as { id: string };
}

