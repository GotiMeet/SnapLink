import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';

/**
 * Gate for every /app route.
 *
 * The `loading` branch is load-bearing: without it, a hard refresh on
 * /app/links renders before GET /auth/me resolves, sees no user, and bounces an
 * authenticated person to /login. Never redirect while the session is unknown.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullPageSpinner label="Loading your workspace" />;
  }

  if (status === 'anonymous') {
    const intended = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(intended)}`} replace />;
  }

  return <Outlet />;
}
