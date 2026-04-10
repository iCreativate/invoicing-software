export type TeamPermission = 'owner' | 'admin' | 'billing' | 'member' | 'viewer';

/** Owner, admin, or billing: payment flows, gateways, marking paid, recording payments. */
export function canManageBilling(permission: TeamPermission | string | null | undefined): boolean {
  const p = String(permission ?? 'member').toLowerCase();
  return p === 'owner' || p === 'admin' || p === 'billing';
}

/** Create/edit invoices, clients, quotes, expenses, etc. Excludes viewer (read-only). */
export function canEditRecords(permission: TeamPermission | string | null | undefined): boolean {
  const p = String(permission ?? 'member').toLowerCase();
  return p === 'owner' || p === 'admin' || p === 'billing' || p === 'member';
}

/** Invite employees and change team permissions. Owner or admin only. */
export function canManageTeam(permission: TeamPermission | string | null | undefined): boolean {
  const p = String(permission ?? 'member').toLowerCase();
  return p === 'owner' || p === 'admin';
}

/**
 * Record payments and use payment UIs. Today same as non-viewer editors plus billing;
 * kept separate for UI labels (billing-focused screens).
 */
export function canRecordPayments(permission: TeamPermission | string | null | undefined): boolean {
  return canManageBilling(permission) || canEditRecords(permission);
}
