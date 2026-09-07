'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UserCheck, UserPlus, Users } from 'lucide-react';
import { ClientsWorkspace } from '@/components/clients/ClientsWorkspace';
import { AdminAlertBanner, AdminPanel } from '@/components/workspace/workspace-ui';
import { PageSummary } from '@/components/layout/PageLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { InviteMemberForm } from '@/components/team/InviteMemberForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/dashboard-ui/EmptyState';
import { fetchEmployeesList, inviteEmployee } from '@/features/employees/api';
import type { EmployeeListItem } from '@/features/employees/types';
import { useWorkspaceCapabilities } from '@/components/workspace/WorkspaceCapabilities';
import { Skeleton } from '@/components/ui/Skeleton';
import { notifyError, notifySuccess } from '@/lib/notify';
import { cn } from '@/lib/utils/cn';

function statusVariant(s: EmployeeListItem['status']) {
  if (s === 'active') return 'success';
  if (s === 'inactive') return 'outline';
  return 'primary';
}

function rowTone(s: EmployeeListItem['status']): 'paid' | 'overdue' | 'draft' | 'open' {
  if (s === 'active') return 'paid';
  if (s === 'inactive') return 'draft';
  return 'open';
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? 'T';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (a + b).toUpperCase();
}

export default function EmployeesPage() {
  const { canManageTeam, status: capStatus } = useWorkspaceCapabilities();
  const canInvite = capStatus === 'ready' && canManageTeam;

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<EmployeeListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [inviteFormKey, setInviteFormKey] = useState(0);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
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

  const totals = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((e) => e.status === 'active').length,
      pending: items.filter((e) => e.status !== 'active' && e.status !== 'inactive').length,
    };
  }, [items]);

  return (
    <ClientsWorkspace
      actions={
        canInvite ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite member
          </Button>
        ) : null
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-5">
        <PageSummary>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3" aria-label="Team snapshot">
            <div className="ti-kpi-card">
              <span className="ti-kpi-icon" aria-hidden>
                <Users className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{loading ? '—' : String(totals.total)}</span>
              <span className="ti-kpi-label">Members</span>
              <span className="ti-kpi-trend">In this workspace</span>
            </div>
            <div className="ti-kpi-card">
              <span className="ti-kpi-icon" aria-hidden>
                <UserCheck className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{loading ? '—' : String(totals.active)}</span>
              <span className="ti-kpi-label">Active</span>
              <span className="ti-kpi-trend">Can sign in</span>
            </div>
            <div className="ti-kpi-card">
              <span className="ti-kpi-icon" aria-hidden>
                <UserPlus className="h-3.5 w-3.5" />
              </span>
              <span className="ti-kpi-value">{loading ? '—' : String(totals.pending)}</span>
              <span className="ti-kpi-label">Pending</span>
              <span className="ti-kpi-trend">Invites or inactive</span>
            </div>
          </div>
        </PageSummary>

        <AdminPanel
          kicker="Directory"
          title={`${filtered.length} member${filtered.length === 1 ? '' : 's'}`}
          description="Roles, permissions, and invitations."
          className="ti-invoice-ledger flex min-h-0 flex-1 flex-col overflow-hidden"
          bodyClassName="mt-0 min-h-0 flex-1"
        >
          <div className="ti-invoice-toolbar">
            <div className="ti-invoice-toolbar-filters ml-auto">
              <div className="relative w-full sm:w-[15rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--tl-ink-3)]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search members"
                  className="pl-9"
                  aria-label="Search members"
                />
              </div>
            </div>
          </div>

          {error ? <AdminAlertBanner tone="error">{error}</AdminAlertBanner> : null}
          {inviteNotice ? <AdminAlertBanner tone="warning">{inviteNotice}</AdminAlertBanner> : null}

          {loading ? (
            <div className="mt-5 space-y-0" aria-busy="true" aria-label="Loading team">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b border-border py-4">
                  <Skeleton className="h-9 w-9 rounded-2xl" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-44 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                kicker={items.length === 0 ? 'No members' : 'No matches'}
                title={items.length === 0 ? 'Invite your first teammate.' : 'No members match that search.'}
                description={
                  items.length === 0
                    ? 'Add people with the right roles so they can help run the books.'
                    : 'Try a different name, email, or role.'
                }
                action={
                  canInvite && items.length === 0 ? (
                    <Button onClick={() => setOpen(true)}>Invite member</Button>
                  ) : null
                }
              />
            </div>
          ) : null}

          {!loading && !error && filtered.length > 0 ? (
            <>
              <div className="mt-4 space-y-3 md:hidden">
                {filtered.map((e) => (
                  <div key={e.id} className="ti-invoice-card" data-tone={rowTone(e.status)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                          {initials(e.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="ti-invoice-client truncate">{e.name}</div>
                          <div className="ti-invoice-meta mt-1 truncate">{e.email}</div>
                        </div>
                      </div>
                      <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                    </div>
                    <div className="ti-invoice-meta border-t border-[var(--tl-line)] pt-3">
                      {e.role} · <span className="capitalize">{e.permission}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden min-h-0 flex-1 overflow-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <TableRow key={e.id} data-tone={rowTone(e.status)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                              {initials(e.name)}
                            </div>
                            <span className="ti-invoice-number">{e.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{e.role}</TableCell>
                        <TableCell className="text-muted-foreground">{e.email}</TableCell>
                        <TableCell className="capitalize">{e.permission}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          <p className={cn('mt-5 ti-caption leading-relaxed text-[var(--tl-ink-3)]')}>
            Permissions: owner and admin manage the team and invitations. Billing can manage payments. Viewer is
            read-only.
          </p>
        </AdminPanel>
      </div>

      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setInviteError(null);
            setInviteFormKey((k) => k + 1);
          }
        }}
      >
        <ModalContent className="max-w-3xl p-6 sm:p-7" aria-describedby="invite-member-desc">
          <ModalHeader>
            <ModalTitle className="ti-h3 text-[var(--tl-ink)]">Invite member</ModalTitle>
            <ModalDescription id="invite-member-desc" className="text-[13px] text-[var(--tl-ink-3)]">
              Add someone to your workspace with the right role and access level.
            </ModalDescription>
          </ModalHeader>

          <div className="mt-5">
            <InviteMemberForm
              key={inviteFormKey}
              submitting={inviting}
              error={inviteError}
              onCancel={() => setOpen(false)}
              onSubmit={async ({ name, email, role, permission }) => {
                setInviteError(null);
                setInviting(true);
                try {
                  setInviteNotice(null);
                  const out = await inviteEmployee({
                    name: name || undefined,
                    email,
                    role,
                    permission,
                  });
                  const list = await fetchEmployeesList();
                  setItems(list);
                  setOpen(false);
                  setInviteFormKey((k) => k + 1);
                  notifySuccess('Invitation sent.');
                  if (out.notice) setInviteNotice(out.notice);
                } catch (e: any) {
                  const msg = e?.message ?? 'Invite failed.';
                  setInviteError(msg);
                  notifyError(msg);
                } finally {
                  setInviting(false);
                }
              }}
            />
          </div>
        </ModalContent>
      </Modal>
    </ClientsWorkspace>
  );
}
