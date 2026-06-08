'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useApiClient } from '@/shared/providers/api-client.provider';
import { getTokenStore } from '@/shared/providers/api-client.provider';
import { queryKeys } from '@/shared/lib/query-keys';
import type { AuthSession, UserProfile } from '@/shared/api/types/auth';

interface AuthContextValue {
  user: UserProfile | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' && !!getTokenStore().getAccessToken();

  const { data: user, isLoading } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.auth.me(),
    enabled: hasToken,
    retry: false,
  });

  const setSession = useCallback(
    (session: AuthSession) => {
      queryClient.setQueryData(queryKeys.auth.me(), session.user);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    const refreshToken = getTokenStore().getRefreshToken();
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {
        getTokenStore().clear();
      }
    } else {
      getTokenStore().clear();
    }
    queryClient.clear();
  }, [api, queryClient]);

  const value = useMemo(
    () => ({
      user: hasToken ? user : null,
      isLoading: hasToken && isLoading,
      isAuthenticated: hasToken && !!user,
      setSession,
      logout,
    }),
    [hasToken, user, isLoading, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
