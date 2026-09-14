import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getMe } from '@/api/auth';
import type { User } from '@/types/models';
import { onSessionExpired } from '@/lib/session';
import {
  AuthContext,
  ME_QUERY_KEY,
  type AuthContextValue,
  type AuthStatus,
} from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  /*
   * Whether this session was deliberately ended — by signing out, or by a
   * password change, which the backend answers by revoking every session.
   *
   * It has to be React state rather than only a cache write. Both callers clear
   * the cache and navigate to /login in the same tick, and TanStack Query
   * notifies its observers through a scheduler, so the guard on the next route
   * still read the previous user and bounced straight back into /app. A state
   * update lands in the same batch as the navigation, so the next render is
   * already anonymous.
   */
  const [signedOut, setSignedOut] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    // A 401 here is not a failure, it is an anonymous visitor. Retrying would
    // delay first paint on every public page.
    retry: false,
    staleTime: 5 * 60_000,
  });

  const signIn = useCallback(
    (user: User) => {
      setSignedOut(false);
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
    [queryClient]
  );

  const clear = useCallback(() => {
    setSignedOut(true);
    queryClient.clear();
    /*
     * Mark the session ended in the same update.
     *
     * clear() alone removes ['me'] and leaves it refetching, so for one render
     * the status is still 'loading' — or, worse, a guard that re-renders before
     * the observer resets still sees the previous user. PublicOnlyRoute in that
     * window reads 'authenticated' and bounces straight back to /app/dashboard,
     * which is what a sign-out and a password change both do immediately after
     * calling this.
     *
     * Seeding null makes the status 'anonymous' synchronously, so whatever
     * navigates next lands where it meant to.
     */
    queryClient.setQueryData(ME_QUERY_KEY, null);
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
    // A deliberate sign-out wins until something authenticates again, so the
    // in-flight /auth/me this triggered cannot momentarily read as signed in.
    if (signedOut && !data) return 'anonymous';
    if (isPending) return 'loading';
    // Any error leaves the user unauthenticated for routing purposes: the app
    // cannot prove a session exists.
    if (isError) return 'anonymous';
    return data ? 'authenticated' : 'anonymous';
  }, [signedOut, isPending, isError, data]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: data ?? null, signIn, refresh, clear }),
    [status, data, signIn, refresh, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
