import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Folder,
  LayoutDashboard,
  Link2,
  PanelLeftClose,
  PanelLeftOpen,
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

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-3xs p-sm">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          // Collapsed, the label is gone from the accessibility tree as well as
          // the screen, so the link needs its name back another way.
          aria-label={collapsed ? label : undefined}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-md py-xs text-body-md transition-colors',
              collapsed ? 'justify-center px-2xs' : 'gap-sm px-sm',
              isActive
                ? 'bg-primary-50 font-semibold text-primary-600'
                : 'text-content-secondary hover:bg-surface-subtle hover:text-content-primary'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {!collapsed && <span>{label}</span>}
              {isActive && <span className="sr-only">(current page)</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Persistent rail, desktop only: 240px, or 68px collapsed. Below 1024px it is
 * replaced by the TopBar's off-canvas drawer, which is always expanded — there
 * is no room to collapse and no pointer precision to justify icon-only targets.
 *
 * Sticky offset is the 64px top bar's height, so the rail scrolls under nothing
 * and its own overflow starts below the header rather than behind it.
 */
export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r border-border-subtle bg-surface-card lg:block',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex-1 overflow-y-auto pt-md">
          <SidebarNav collapsed={collapsed} />
        </div>

        <div className="border-t border-border-subtle p-sm">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center rounded-md py-xs text-body-md text-content-tertiary transition-colors',
              'hover:bg-surface-subtle hover:text-content-primary',
              collapsed ? 'justify-center px-2xs' : 'gap-sm px-sm'
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
