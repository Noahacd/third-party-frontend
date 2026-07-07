import { create } from 'zustand';

import { bootstrapAuthSession } from '@/lib/request/api/auth.requests';
import type { AuthSession } from '@/types/auth';

type AuthState = {
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
  ensureSession: () => Promise<AuthSession | null>;
  initSession: () => Promise<AuthSession | null>;
  refreshSession: () => Promise<AuthSession | null>;
};

let pendingBootstrap: Promise<AuthSession | null> | null = null;
let bootstrapId = 0;

function runBootstrap(
  set: (
    partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)
  ) => void,
  errorMessage: string
) {
  const id = ++bootstrapId;

  pendingBootstrap = bootstrapAuthSession()
    .then((nextSession) => {
      set({
        session: nextSession,
        initialized: true,
        loading: false,
        error: null,
      });
      return nextSession;
    })
    .catch(() => {
      set({
        session: null,
        initialized: true,
        loading: false,
        error: errorMessage,
      });
      return null;
    })
    .finally(() => {
      if (bootstrapId === id) {
        pendingBootstrap = null;
      }
    });

  return pendingBootstrap;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: false,
  initialized: false,
  error: null,

  setSession: (session) => set({ session }),

  clearSession: () => {
    bootstrapId += 1;
    pendingBootstrap = null;
    set({ session: null, error: null });
  },

  ensureSession: async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const { session } = get();
    if (session) {
      return session;
    }

    if (!pendingBootstrap) {
      runBootstrap(set, '无法获取登录状态，请确认后端服务已启动。');
    }

    return pendingBootstrap;
  },

  initSession: async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    const { initialized, loading } = get();
    if (initialized && !loading) {
      return get().session;
    }

    set({ loading: true, error: null });
    return get().ensureSession();
  },

  refreshSession: async () => {
    if (typeof window === 'undefined') {
      return null;
    }

    bootstrapId += 1;
    pendingBootstrap = null;
    set({ session: null, loading: true, error: null });

    return runBootstrap(set, '刷新会话失败，请稍后重试。');
  },
}));

export function getAuthSession(): AuthSession | null {
  return useAuthStore.getState().session;
}

export function getAccessToken() {
  return useAuthStore.getState().session?.accessToken ?? null;
}
