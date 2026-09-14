import { createContext } from 'react';
import type { User } from '@/types/models';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /**
   * Seed the session from a login or Google response. Those endpoints already
   * return the user, so priming the cache avoids an extra GET /auth/me and
   * closes the window where a just-authenticated user is still 'anonymous'.
   */
  signIn: (user: User) => void;
  /** Re-read the session from the server, e.g. after login or profile update. */
  refresh: () => Promise<void>;
  /** Drop all cached data. Called on logout and after a password change. */
  clear: () => void;
}

/**
 * Kept in its own module, separate from AuthProvider, so the provider file
 * exports only components and Vite fast refresh keeps working.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

export const ME_QUERY_KEY = ['me'] as const;
