import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, Monitor, Moon, Sun, X } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTheme, type ThemeChoice } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { BrandMark } from './BrandMark';
import { CreateMenu } from './CreateMenu';
import { ProfileMenu } from './ProfileMenu';
import { SidebarNav } from './Sidebar';

const THEMES: Array<{ value: ThemeChoice; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

/**
 * Three explicit choices rather than a cycling button. System is a real state,
 * not the absence of one, and a two-way toggle cannot express it — a user who
 * wants to follow the OS has no way back once they have picked either side.
 */
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

/**
 * 64px bar: brand, "+ Create", theme toggle, account menu.
 *
 * The quick-search pill from section 8 is still absent. It is a client-side
 * filter over loaded links and projects, and it belongs with the command
 * palette rather than as a third partial search box beside the two the catalog
 * pages already have.
 */
export function TopBar() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-md border-b border-border-subtle bg-surface-card px-md">
      {/* Off-canvas navigation, below the 1024px sidebar breakpoint. */}
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
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-border-subtle bg-surface-card lg:hidden">
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
        <BrandMark compact />
      </Link>

      <div className="ml-auto flex items-center gap-sm">
        <CreateMenu />
        <ThemeToggle />
        {user && <ProfileMenu user={user} />}
      </div>
    </header>
  );
}
