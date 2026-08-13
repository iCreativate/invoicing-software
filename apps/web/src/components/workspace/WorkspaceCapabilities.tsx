'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isDemoUiActive } from '@/lib/demo/accounts';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getBrowserUserSafe } from '@/lib/supabase/browserAuth';

export type WorkspaceCapabilitiesState = {
  status: 'idle' | 'loading' | 'ready';
  permission: string;
  canEdit: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
  canRecordPayments: boolean;
};

const defaultOpen: WorkspaceCapabilitiesState = {
  status: 'ready',
  permission: 'owner',
  canEdit: true,
  canManageTeam: true,
  canManageBilling: true,
  canRecordPayments: true,
};

const Ctx = createContext<WorkspaceCapabilitiesState | null>(null);

export function WorkspaceCapabilitiesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceCapabilitiesState>({
    status: 'idle',
    permission: 'member',
    canEdit: false,
    canManageTeam: false,
    canManageBilling: false,
    canRecordPayments: false,
  });

  const refresh = useCallback(async () => {
    if (isDemoUiActive()) {
      setState({ ...defaultOpen, status: 'ready' });
      return;
    }
    const user = await getBrowserUserSafe();
    if (!user) {
      setState({ ...defaultOpen, status: 'ready' });
      return;
    }
    setState((s) => ({
      ...s,
      status: 'loading',
      canEdit: false,
      canManageTeam: false,
      canManageBilling: false,
      canRecordPayments: false,
    }));
    try {
      const res = await fetch('/api/me/workspace', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.data) {
        setState({
          status: 'ready',
          permission: 'member',
          canEdit: true,
          canManageTeam: true,
          canManageBilling: true,
          canRecordPayments: true,
        });
        return;
      }
      const d = json.data;
      setState({
        status: 'ready',
        permission: String(d.permission ?? 'member'),
        canEdit: Boolean(d.canEdit),
        canManageTeam: Boolean(d.canManageTeam),
        canManageBilling: Boolean(d.canManageBilling),
        canRecordPayments: Boolean(d.canRecordPayments),
      });
    } catch {
      setState({
        status: 'ready',
        permission: 'member',
        canEdit: true,
        canManageTeam: true,
        canManageBilling: true,
        canRecordPayments: true,
      });
    }
  }, []);

  useEffect(() => {
    if (isDemoUiActive()) {
      setState({ ...defaultOpen, status: 'ready' });
      return;
    }

    void refresh();
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const user = await getBrowserUserSafe();
      if (cancelled || !user) return;
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: sub } = supabase.auth.onAuthStateChange(() => {
          void refresh();
        });
        unsubscribe = () => sub.subscription.unsubscribe();
      } catch {
        // Supabase unreachable — stay on open defaults after refresh() settles.
      }
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [refresh]);

  const value = useMemo(() => state, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspaceCapabilities(): WorkspaceCapabilitiesState {
  const v = useContext(Ctx);
  if (!v) return defaultOpen;
  return v;
}
