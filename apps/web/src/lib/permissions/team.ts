export type TeamPermission = 'owner' | 'admin' | 'billing' | 'member' | 'viewer';

export function canManageBilling(permission: TeamPermission | string | null | undefined): boolean {
  const p = String(permission ?? 'member').toLowerCase();
  return p === 'owner' || p === 'admin' || p === 'billing';
}

export function canEditRecords(permission: TeamPermission | string | null | undefined): boolean {
  const p = String(permission ?? 'member').toLowerCase();
  return p === 'owner' || p === 'admin' || p === 'billing' || p === 'member';
}

export function canManageTeam(permission: TeamPermission | string | null | undefined): boolean {
  const p = String(permission ?? 'member').toLowerCase();
  return p === 'owner' || p === 'admin';
}
