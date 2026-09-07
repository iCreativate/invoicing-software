import type { TeamPermission } from '@/lib/permissions/team';

export type TeamPermissionKey = TeamPermission;

export const JOB_ROLE_OPTIONS = ['Employee', 'Finance', 'Administrator'] as const;

export type JobRole = (typeof JOB_ROLE_OPTIONS)[number];

export const TEAM_PERMISSION_OPTIONS: {
  value: TeamPermissionKey;
  label: string;
  description: string;
  capabilities: string[];
  recommended?: boolean;
  sensitive?: boolean;
}[] = [
  {
    value: 'member',
    label: 'Staff',
    description: 'Create and edit invoices, clients, quotes, and expenses.',
    capabilities: ['Create & edit records', 'Send invoices & quotes', 'View reports'],
    recommended: true,
  },
  {
    value: 'billing',
    label: 'Billing',
    description: 'Finance workflows plus payment recording and gateways.',
    capabilities: ['Everything in Staff', 'Record payments', 'Manage billing settings'],
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Team management and workspace configuration.',
    capabilities: ['Everything in Billing', 'Invite team members', 'Workspace settings'],
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access across the workspace.',
    capabilities: ['View invoices & clients', 'View reports', 'No edits or invites'],
  },
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full access including ownership-level controls.',
    capabilities: ['Full workspace access', 'Billing & team management', 'All settings'],
    sensitive: true,
  },
];

export function permissionLabel(value: string) {
  return TEAM_PERMISSION_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function permissionOption(value: string) {
  return TEAM_PERMISSION_OPTIONS.find((o) => o.value === value);
}
