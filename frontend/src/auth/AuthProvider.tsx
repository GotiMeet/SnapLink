import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getMe } from '@/api/auth';
import { onSessionExpired } from '@/lib/session';
import {
  AuthContext,
  ME_QUERY_KEY,
  type AuthContextValue,
  type AuthStatus,
} from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    // A 401 here is not a failure, it is an anonymous visitor. Retrying would
    // delay first paint on every public page.
    retry: false,
    staleTime: 5 * 60_000,
  });

  const clear = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  }, [queryClient]);

  /**
   * The network layer signals when a refresh attempt failed, which means the
   * session is genuinely over. Without this, a 401 on some background query
   * would leave a stale authenticated user in context and no redirect would
   * ever happen — the user would sit on a broken page.
   */
  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.setQueryData(ME_QUERY_KEY, null);
      }),
    [queryClient]
  );

  const status: AuthStatus = useMemo(() => {
    if (isPending) return 'loading';
    // Any error leaves the user unauthenticated for routing purposes: the app
    // cannot prove a session exists.
    if (isError) return 'anonymous';
    return data ? 'authenticated' : 'anonymous';
  }, [isPending, isError, data]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: data ?? null, refresh, clear }),
    [status, data, refresh, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
