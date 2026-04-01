'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { fetchEmployeesList, inviteEmployee } from '@/features/employees/api';
import type { EmployeeListItem } from '@/features/employees/types';

function statusVariant(s: EmployeeListItem['status']) {
  if (s === 'active') return 'success';
  if (s === 'inactive') return 'outline';
  return 'primary';
}

export default function EmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<EmployeeListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Employee');
  const [invitePermission, setInvitePermission] = useState('member');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchEmployeesList();
        if (!alive) return;
        setItems(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load employees.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((e) => `${e.name} ${e.role} ${e.email} ${e.status}`.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <AppShell
      title="Employees"
      actions={
        <Button onClick={() => setOpen(true)}>Invite employee</Button>
      }
    >
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Team directory</div>
            <div className="mt-1 text-sm text-muted-foreground">{loading ? 'Loading…' : `${filtered.length} member(s)`}</div>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees…" />
          </div>
        </div>

        {error ? <div className="mt-4 rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No employees yet. Invite your first team member.
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-semibold text-muted-foreground">
                <th className="border-b border-border px-3 py-2">Name</th>
                <th className="border-b border-border px-3 py-2">Role</th>
                <th className="border-b border-border px-3 py-2">Email</th>
                <th className="border-b border-border px-3 py-2">Permission</th>
                <th className="border-b border-border px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="text-sm">
                  <td className="border-b border-zinc-100 px-3 py-3 font-semibold dark:border-zinc-900">{e.name}</td>
                  <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">{e.role}</td>
                  <td className="border-b border-zinc-100 px-3 py-3 text-muted-foreground dark:border-zinc-900">{e.email}</td>
                  <td className="border-b border-zinc-100 px-3 py-3 capitalize dark:border-zinc-900">{e.permission}</td>
                  <td className="border-b border-zinc-100 px-3 py-3 dark:border-zinc-900">
                    <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-2xl bg-muted/20 p-4 text-sm text-muted-foreground">
          Permissions: owner/admin manage team; billing can manage payments; viewer is read-only (UI enforcement expanding).
        </div>
      </Card>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="text-lg font-semibold">Invite employee</ModalTitle>
            <ModalDescription className="text-sm text-muted-foreground">
              Send an invite email and assign a role.
            </ModalDescription>
          </ModalHeader>

          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                className="h-11 w-full rounded-xl bg-white/70 px-3 text-sm shadow-[var(--shadow-sm)] dark:bg-white/5"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option>Employee</option>
                <option>Finance</option>
                <option>Administrator</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Permission</label>
              <select
                className="h-11 w-full rounded-xl bg-white/70 px-3 text-sm shadow-[var(--shadow-sm)] dark:bg-white/5"
                value={invitePermission}
                onChange={(e) => setInvitePermission(e.target.value)}
              >
                <option value="member">Member — create &amp; edit records</option>
                <option value="billing">Billing — finance + payments</option>
                <option value="admin">Admin — team + settings</option>
                <option value="viewer">Viewer — read only</option>
                <option value="owner">Owner — full access</option>
              </select>
            </div>

            {inviteError ? <div className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{inviteError}</div> : null}

            <div className="mt-1 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={inviting}
                onClick={async () => {
                  setInviteError(null);
                  const email = inviteEmail.trim();
                  if (!email.includes('@')) {
                    setInviteError('Enter a valid email.');
                    return;
                  }
                  setInviting(true);
                  try {
                    await inviteEmployee({
                      name: inviteName.trim() || undefined,
                      email,
                      role: inviteRole,
                      permission: invitePermission,
                    });
                    const list = await fetchEmployeesList();
                    setItems(list);
                    setInviteEmail('');
                    setInviteName('');
                    setInviteRole('Employee');
                    setInvitePermission('member');
                    setOpen(false);
                  } catch (e: any) {
                    setInviteError(e?.message ?? 'Invite failed.');
                  } finally {
                    setInviting(false);
                  }
                }}
              >
                {inviting ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}

