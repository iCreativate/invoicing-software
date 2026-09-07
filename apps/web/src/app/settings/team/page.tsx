'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Shield, Users } from 'lucide-react';
import { SettingsWorkspace } from '@/components/settings/SettingsWorkspace';
import { AdminPanel } from '@/components/settings/admin-ui';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { routes } from '@/lib/routing/routes';

import { TEAM_PERMISSION_OPTIONS } from '@/lib/team/permissions';

export default function SettingsTeamPage() {
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState('owner');
  const [canManageTeam, setCanManageTeam] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/settings', { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!alive || !res.ok || !json.success) return;
        setPermission(String(json.data?.workspace?.permission ?? 'owner'));
        setCanManageTeam(Boolean(json.data?.workspace?.canManageTeam));
      } catch {
        // keep defaults
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <SettingsWorkspace>
      <div className="flex flex-col gap-4 md:gap-5">
        <div className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-white shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--tl-navy)] text-white">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Your access</div>
              <div className="mt-0.5 capitalize text-[15px] font-semibold text-[var(--tl-ink)]">
                {loading ? 'Loading…' : permission}
              </div>
              {!loading && canManageTeam ? (
                <p className="mt-1 ti-caption text-[var(--tl-ink-3)]">You can invite and manage team permissions.</p>
              ) : null}
            </div>
          </div>
        </div>

        <AdminPanel
          kicker="Roles & permissions"
          description="How access works in this workspace."
          actions={
            <Button asChild size="sm">
              <Link href={routes.app.team}>
                <Users className="mr-2 h-4 w-4" />
                Manage team
              </Link>
            </Button>
          }
          bodyClassName="mt-0"
        >
          {loading ? (
            <div className="space-y-3" aria-busy>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-[var(--tl-radius-sm)]" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--tl-line)] border-y border-[var(--tl-line)]" role="list">
              {TEAM_PERMISSION_OPTIONS.map((role) => (
                <li key={role.value} className="py-4 first:pt-0 last:pb-0">
                  <div className="text-[13px] font-semibold text-[var(--tl-ink)]">{role.label}</div>
                  <p className="mt-1 ti-caption leading-relaxed text-[var(--tl-ink-3)]">{role.description}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>
    </SettingsWorkspace>
  );
}
