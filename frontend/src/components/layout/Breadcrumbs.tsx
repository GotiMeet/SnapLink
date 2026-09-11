import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Trail for the main stage, derived from the pathname.
 *
 * Only segments with a known label appear. A dynamic segment — a project or
 * link id — has no entry here, so the trail ends at its section and the page's
 * own h1 carries the entity name. Resolving an id to a title needs the fetch
 * that only the detail page makes, and there is no detail page yet; the crumb
 * gains a title when a screen exists to supply one.
 */
const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  links: 'All Links',
  analytics: 'Analytics',
  'recycle-bin': 'Recycle Bin',
  settings: 'Settings',
  profile: 'Profile',
  security: 'Security',
};

const ROOT = { to: '/app/dashboard', label: 'Dashboard' };

export function Breadcrumbs() {
  const { pathname } = useLocation();

  // Drop the leading "app"; every crumb below is relative to it.
  const segments = pathname.split('/').filter(Boolean).slice(1);

  const crumbs: Array<{ to: string; label: string }> = [];
  let path = '/app';

  for (const segment of segments) {
    path += `/${segment}`;
    const label = LABELS[segment];
    // An unlabelled segment is an id. Stop rather than print it.
    if (!label) break;
    crumbs.push({ to: path, label });
  }

  // Dashboard is the root crumb, so on the dashboard itself the trail would be
  // a single non-link. Nothing to navigate, so render nothing.
  if (crumbs.length === 0 || (crumbs.length === 1 && crumbs[0]?.to === ROOT.to)) {
    return null;
  }

  const trail = [ROOT, ...crumbs];

  return (
    <nav aria-label="Breadcrumb" className="mb-md">
      <ol className="flex flex-wrap items-center gap-2xs text-body-sm">
        {trail.map((crumb, index) => {
          const isCurrent = index === trail.length - 1;
          return (
            <li key={crumb.to} className="flex items-center gap-2xs">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-content-tertiary" aria-hidden />
              )}
              {isCurrent ? (
                <span aria-current="page" className="text-content-primary">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="rounded-sm text-content-tertiary hover:text-content-primary"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
