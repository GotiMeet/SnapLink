import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, Monitor, Moon, Sun, X } from 'lucide-react';
import { toast } from 'sonner';

import { logout as logoutRequest } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, type ThemeChoice } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { BrandMark } from './BrandMark';
import { SidebarNav } from './Sidebar';

const THEMES: Array<{ value: ThemeChoice; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-3xs rounded-md border border-border-subtle p-3xs"
    >
      {THEMES.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            'rounded-sm p-2xs transition-colors',
            theme === value
              ? 'bg-primary-50 text-primary-600'
              : 'text-content-tertiary hover:text-content-primary'
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}

const initialsOf = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export function TopBar() {
  const { user, clear } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // The cookie may already be gone. Clearing local state is what matters,
      // so a failed call must not strand the user in a signed-in shell.
    }
    // Clear every cached query: a stale ['urls'] entry would otherwise be
    // visible to the next person on a shared machine.
    clear();
    navigate('/login', { replace: true });
    toast.success('Signed out');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-md border-b border-border-subtle bg-surface-card px-md">
      {/* Mobile navigation drawer, below the 1024px sidebar breakpoint. */}
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="rounded-md p-2xs text-content-secondary hover:bg-surface-subtle lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border-subtle bg-surface-card lg:hidden">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <div className="flex h-16 items-center justify-between px-sm">
              <BrandMark />
              <Dialog.Close
                aria-label="Close navigation menu"
                className="rounded-md p-2xs text-content-tertiary hover:bg-surface-subtle"
              >
                <X className="h-5 w-5" aria-hidden />
              </Dialog.Close>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Link to="/app/dashboard" className="rounded-md">
        <BrandMark />
      </Link>

      <div className="ml-auto flex items-center gap-sm">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-xs">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-label-lg text-white"
            >
              {initialsOf(user.fullName)}
            </span>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-label-lg text-content-primary">{user.fullName}</span>
              <span className="text-body-sm text-content-tertiary">{user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
