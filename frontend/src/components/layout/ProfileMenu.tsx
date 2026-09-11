import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Shield, UserRound } from 'lucide-react';

import { logout as logoutRequest } from '@/api/auth';
import { DropdownMenu, MenuSeparator, menuItemClass } from '@/components/ui/DropdownMenu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import type { User } from '@/types/models';

const initialsOf = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

/**
 * Account menu: name and email, Profile Settings, Security Settings, Sign Out.
 * Nothing else — PROJECT_MASTER.md section 8 rules out a notifications bell,
 * and there is no notification system to put behind one.
 */
export function ProfileMenu({ user }: { user: User }) {
  const { clear } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutRequest();
    } catch {
      // The cookie may already be gone, or the network may be down. Local state
      // is what decides whether the app looks signed in, so a failed call must
      // not strand the user inside the shell.
    }
    /*
     * A full document replace, for the same reason the password change uses
     * one: the session is over, and discarding the JS context clears every
     * cached query by construction. On a shared machine that matters — a stale
     * ['urls'] entry would otherwise be readable by whoever signs in next — and
     * it avoids racing the route guards, which can otherwise bounce between
     * /login and the dashboard while the auth state settles.
     */
    clear();
    window.location.replace('/login');
  };

  return (
    <DropdownMenu
      label="Account"
      width="w-64"
      triggerClassName="flex items-center gap-xs rounded-md p-3xs text-left transition-colors hover:bg-surface-subtle"
      trigger={
        <>
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-label-lg text-white"
          >
            {initialsOf(user.fullName)}
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-label-lg text-content-primary">
              {user.fullName}
            </span>
            <span className="truncate text-body-sm text-content-tertiary">
              {user.email}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-content-tertiary" aria-hidden />
          <span className="sr-only">Account menu</span>
        </>
      }
    >
      <div className="border-b border-border-subtle px-sm py-xs">
        <p className="truncate text-label-lg text-content-primary">{user.fullName}</p>
        <p className="truncate text-body-sm text-content-tertiary">{user.email}</p>
      </div>

      <Link role="menuitem" to="/app/settings/profile" className={menuItemClass}>
        <UserRound className="h-4 w-4 shrink-0" aria-hidden />
        Profile Settings
      </Link>
      <Link role="menuitem" to="/app/settings/security" className={menuItemClass}>
        <Shield className="h-4 w-4 shrink-0" aria-hidden />
        Security Settings
      </Link>

      <MenuSeparator />

      <button
        role="menuitem"
        type="button"
        disabled={signingOut}
        onClick={handleSignOut}
        className={cn(
          menuItemClass,
          'text-danger hover:bg-danger/10 hover:text-danger disabled:opacity-50'
        )}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        {signingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    </DropdownMenu>
  );
}
