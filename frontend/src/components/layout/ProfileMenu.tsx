import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Shield, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { logout as logoutRequest } from '@/api/auth';
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
 *
 * Hand-rolled rather than reaching for @radix-ui/react-dropdown-menu: section 6
 * admits a dependency only against a stated requirement, and the one that
 * justifies Radix Dialog — focus trapping on an overlay — does not apply to a
 * menu. What a menu does owe the user is Escape, click-away, focus returned to
 * the trigger, and arrow-key movement, which is what follows.
 */
export function ProfileMenu({ user }: { user: User }) {
  const { clear } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Navigating with the menu open would leave it hanging over the new page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
      );
      if (items.length === 0) return;

      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      // Wraps in both directions, so ArrowUp from the trigger lands on the last
      // item rather than going nowhere.
      const next = (current + step + items.length) % items.length;
      items[current === -1 && step === -1 ? items.length - 1 : next]?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutRequest();
    } catch {
      // The cookie may already be gone, or the network may be down. Local state
      // is what decides whether the app looks signed in, so a failed call must
      // not strand the user inside the shell.
    }
    // Clearing every cached query matters on a shared machine: a stale ['urls']
    // entry would otherwise be readable by whoever signs in next.
    clear();
    navigate('/login', { replace: true });
    toast.success('Signed out');
  };

  const itemClass =
    'flex w-full items-center gap-xs px-sm py-xs text-body-md text-content-secondary hover:bg-surface-subtle hover:text-content-primary';

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-xs rounded-md p-3xs text-left transition-colors hover:bg-surface-subtle"
      >
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
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-content-tertiary transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden
        />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 overflow-hidden rounded-lg border border-border-subtle bg-surface-card py-2xs shadow-lg"
        >
          <div className="border-b border-border-subtle px-sm py-xs">
            <p className="truncate text-label-lg text-content-primary">{user.fullName}</p>
            <p className="truncate text-body-sm text-content-tertiary">{user.email}</p>
          </div>

          <div className="py-2xs">
            <Link role="menuitem" to="/app/settings/profile" className={itemClass}>
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              Profile Settings
            </Link>
            <Link role="menuitem" to="/app/settings/security" className={itemClass}>
              <Shield className="h-4 w-4 shrink-0" aria-hidden />
              Security Settings
            </Link>
          </div>

          <div className="border-t border-border-subtle py-2xs">
            <button
              role="menuitem"
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className={cn(
                itemClass,
                'text-danger hover:bg-danger/10 hover:text-danger disabled:opacity-50'
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
