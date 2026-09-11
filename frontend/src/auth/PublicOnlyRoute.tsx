import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { safeRedirect } from '@/lib/redirect';

/**
 * Keeps a signed-in user off the login and signup screens. Honours an existing
 * ?redirect so returning from a protected route still lands where intended.
 *
 * The redirect value is attacker-controllable, so it goes through safeRedirect
 * rather than straight into <Navigate>. See lib/redirect.ts.
 */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullPageSpinner label="Loading" />;
  }

  if (status === 'authenticated') {
    const requested = new URLSearchParams(location.search).get('redirect');
    return <Navigate to={safeRedirect(requested, '/app/dashboard')} replace />;
  }

  return <Outlet />;
}
