'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  CreditCard,
  Eye,
  Mail,
  Shield,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminAlertBanner } from '@/components/workspace/workspace-ui';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import {
  JOB_ROLE_OPTIONS,
  TEAM_PERMISSION_OPTIONS,
  type JobRole,
  type TeamPermissionKey,
} from '@/lib/team/permissions';
import { cn } from '@/lib/utils/cn';

const PERMISSION_ICONS: Record<TeamPermissionKey, LucideIcon> = {
  member: User,
  billing: CreditCard,
  admin: UserCog,
  viewer: Eye,
  owner: Shield,
};

function AccessLevelPicker({
  value,
  onChange,
}: {
  value: TeamPermissionKey;
  onChange: (value: TeamPermissionKey) => void;
}) {
  const primary = TEAM_PERMISSION_OPTIONS.filter((o) => !o.sensitive);
  const advanced = TEAM_PERMISSION_OPTIONS.filter((o) => o.sensitive);

  return (
    <div className="space-y-4">
      <div
        className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-surface)]"
        role="radiogroup"
        aria-label="Access level"
      >
        {primary.map((opt, index) => {
          const Icon = PERMISSION_ICONS[opt.value];
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                index > 0 && 'border-t border-[var(--tl-line)]',
                active
                  ? 'bg-[color-mix(in_srgb,var(--tl-navy)_7%,white)]'
                  : 'hover:bg-[var(--tl-bg)]'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                  active
                    ? 'border-[color-mix(in_srgb,var(--tl-navy)_30%,transparent)] bg-[var(--tl-navy)] text-white'
                    : 'border-[var(--tl-line)] bg-[var(--tl-bg)] text-[var(--tl-ink-2)]'
                )}
                aria-hidden
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-[var(--tl-ink)]">{opt.label}</span>
                  {opt.recommended ? (
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--tl-navy)_10%,white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tl-navy)]">
                      Default
                    </span>
                  ) : null}
                </span>
              </span>
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    active
                      ? 'border-[var(--tl-navy)] bg-[var(--tl-navy)]'
                      : 'border-[color-mix(in_srgb,var(--tl-ink-3)_35%,transparent)] bg-transparent'
                )}
                aria-hidden
              >
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {advanced.length > 0 ? (
        <div>
          <p className="mb-2 ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Advanced</p>
          <div
            className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-dashed border-[var(--tl-line)] bg-[var(--tl-bg)]"
            role="radiogroup"
            aria-label="Advanced access level"
          >
            {advanced.map((opt) => {
              const Icon = PERMISSION_ICONS[opt.value];
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                    active ? 'bg-[color-mix(in_srgb,var(--ti-warning)_10%,white)]' : 'hover:bg-[var(--tl-surface)]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                      active
                        ? 'border-[color-mix(in_srgb,var(--ti-warning)_35%,transparent)] bg-[var(--tl-ink)] text-white'
                        : 'border-[var(--tl-line)] bg-[var(--tl-surface)] text-[var(--tl-ink-2)]'
                    )}
                    aria-hidden
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold text-[var(--tl-ink)]">{opt.label}</span>
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      active
                        ? 'border-[var(--tl-ink)] bg-[var(--tl-ink)]'
                        : 'border-[color-mix(in_srgb,var(--tl-ink-3)_35%,transparent)] bg-transparent'
                    )}
                    aria-hidden
                  >
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email.trim()[0] ?? '?').toUpperCase();
}

function InvitePreviewCard({
  name,
  email,
  role,
  permission,
}: {
  name: string;
  email: string;
  role: string;
  permission: TeamPermissionKey;
}) {
  const perm = TEAM_PERMISSION_OPTIONS.find((o) => o.value === permission);
  const displayName = name.trim() || email.trim() || 'New teammate';
  const hasEmail = Boolean(email.trim());

  return (
    <div className="overflow-hidden rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-surface)] shadow-[var(--shadow-elevated)]">
      <div className="border-b border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3">
        <p className="ti-caption font-semibold uppercase tracking-wider text-[var(--tl-ink-3)]">Invitation preview</p>
        <p className="mt-1 text-[12px] text-[var(--tl-ink-3)]">What they&apos;ll receive access to</p>
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tl-navy)_12%,white)] text-[13px] font-bold text-[var(--tl-navy)]"
            aria-hidden
          >
            {initials(name, email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[var(--tl-ink)]">{displayName}</p>
            {hasEmail ? (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-[var(--tl-ink-2)]">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--tl-ink-3)]" aria-hidden />
                {email.trim()}
              </p>
            ) : (
              <p className="mt-0.5 text-[13px] text-[var(--tl-ink-3)]">Email required to send invite</p>
            )}
            <p className="mt-2 text-[12px] font-medium text-[var(--tl-ink-3)]">
              {role} · {perm?.label ?? permission}
            </p>
            {perm ? <p className="mt-1 text-[12px] leading-relaxed text-[var(--tl-ink-3)]">{perm.description}</p> : null}
          </div>
        </div>

        {perm ? (
          <ul className="mt-4 space-y-2 border-t border-[var(--tl-line)] pt-4">
            {perm.capabilities.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--tl-ink-2)]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--tl-success)]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function InviteMemberForm({
  submitting = false,
  error,
  onSubmit,
  onCancel,
}: {
  submitting?: boolean;
  error?: string | null;
  onSubmit: (data: { name: string; email: string; role: string; permission: TeamPermissionKey }) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<JobRole>('Employee');
  const [permission, setPermission] = useState<TeamPermissionKey>('member');
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedPermission = useMemo(
    () => TEAM_PERMISSION_OPTIONS.find((o) => o.value === permission),
    [permission]
  );

  const canSubmit = email.trim().includes('@') && !submitting;

  const handleSubmit = async () => {
    setLocalError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      setLocalError('Enter a valid email address.');
      return;
    }
    await onSubmit({
      name: name.trim(),
      email: trimmedEmail,
      role,
      permission,
    });
  };

  const displayError = error ?? localError;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:gap-6">
      <div className="grid gap-5">
        <div className="rounded-[var(--tl-radius-sm)] border border-[var(--tl-line)] bg-[var(--tl-bg)] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tl-navy)_10%,white)] text-[var(--tl-navy)]">
              <Users className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[var(--tl-ink)]">Invite a teammate</p>
              <p className="text-[13px] text-[var(--tl-ink-3)]">
                They&apos;ll get an email to join this workspace with the access you choose.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="invite-name" hint="Optional — shown in the team directory.">
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              autoComplete="name"
            />
          </Field>
          <Field label="Work email" htmlFor="invite-email" hint="We'll send the invitation here.">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </Field>
        </div>

        <Field label="Job title" htmlFor="invite-role" hint="Displayed on the team page — not the permission level.">
          <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as JobRole)}>
            {JOB_ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Access level" hint="Details for the selected level appear in the preview.">
          <AccessLevelPicker value={permission} onChange={setPermission} />
        </Field>

        {selectedPermission?.sensitive ? (
          <AdminAlertBanner tone="warning">
            <span className="font-medium">Owner access grants full control</span>
            <p className="mt-1">
              Only assign owner to people who should manage billing, team access, and all workspace data.
            </p>
          </AdminAlertBanner>
        ) : null}

        {displayError ? <AdminAlertBanner tone="error">{displayError}</AdminAlertBanner> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--tl-line)] pt-4">
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="button" disabled={!canSubmit} loading={submitting} onClick={() => void handleSubmit()}>
            {submitting ? 'Sending…' : 'Send invitation'}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-0 lg:self-start">
        <InvitePreviewCard name={name} email={email} role={role} permission={permission} />
        <p className="mt-4 ti-caption leading-relaxed text-[var(--tl-ink-3)]">
          You can change permissions later from the team directory. Viewers cannot edit records or send invites.
        </p>
      </div>
    </div>
  );
}
