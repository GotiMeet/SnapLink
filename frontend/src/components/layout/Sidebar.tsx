import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Folder,
  LayoutDashboard,
  Link2,
  Settings,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * Exactly six items, in this order (PROJECT_MASTER.md section 8).
 *
 * Analytics belongs here because /app/analytics is a real v1 route
 * (SCR-AUTH-09A). An earlier draft of the inventory listed five items and
 * omitted it, which would have left that route unreachable from the shell.
 */
const NAV: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/projects', label: 'Projects', icon: Folder },
  { to: '/app/links', label: 'All Links', icon: Link2 },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/recycle-bin', label: 'Recycle Bin', icon: Trash2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-3xs p-sm">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-sm rounded-md px-sm py-xs text-body-md transition-colors',
              isActive
                ? 'bg-primary-50 font-semibold text-primary-600'
                : 'text-content-secondary hover:bg-surface-subtle hover:text-content-primary'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{label}</span>
              {isActive && <span className="sr-only">(current page)</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Persistent rail, desktop only. Below 1024px the TopBar drawer takes over. */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border-subtle bg-surface-card lg:block">
      <div className="sticky top-0 max-h-screen overflow-y-auto pt-md">
        <SidebarNav />
      </div>
    </aside>
  );
}
