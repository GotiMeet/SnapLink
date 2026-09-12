import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, Monitor, Moon, Sun, X } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTheme, type ThemeChoice } from '@/hooks/useTheme';
import { BrandMark } from './BrandMark';
import { RadioCards } from '@/components/ui/RadioCards';
import { CreateMenu } from './CreateMenu';
import { QuickSearch } from './QuickSearch';
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
    <RadioCards
      compact
      label="Colour theme"
      value={theme}
      onChange={setTheme}
      options={THEMES.map(({ value, label, Icon }) => ({
        value,
        label,
        icon: <Icon className="h-4 w-4" aria-hidden />,
      }))}
    />
  );
}

/**
 * 64px bar: brand, quick search, "+ Create", theme toggle, account menu —
 * the five things section 8 specifies, and no notifications bell, because no
 * notification system exists.
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
            className="flex h-10 w-10 items-center justify-center rounded-md text-content-secondary hover:bg-surface-subtle lg:hidden"
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

      <Link to="/app/dashboard" className="shrink-0 rounded-md">
        <BrandMark compact />
      </Link>

      <div className="ml-auto flex min-w-0 items-center gap-xs sm:gap-sm">
        <QuickSearch />
        <CreateMenu />
        {/*
          Hidden on phones, where the bar has no room for a three-state control
          once search, create and the account menu are present. Theme is not
          lost: its permanent home is Settings → Profile, which is where
          section 9 puts it anyway.
        */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        {user && <ProfileMenu user={user} />}
      </div>
    </header>
  );
}
