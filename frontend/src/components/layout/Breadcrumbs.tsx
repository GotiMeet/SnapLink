import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Trail for the main stage, derived from the pathname.
 *
 * A dynamic segment — a project or link id — has no label here, because only
 * the page that fetched it knows the title behind it. That page supplies one
 * through BreadcrumbTitleContext; until it does, the crumb is a skeleton rather
 * than a raw Mongo id.
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

export function Breadcrumbs({ detailTitle }: { detailTitle: string | null }) {
  const { pathname } = useLocation();

  // Drop the leading "app"; every crumb below is relative to it.
  const segments = pathname.split('/').filter(Boolean).slice(1);

  const crumbs: Array<{ to: string; label: string }> = [];
  let path = '/app';
  let hasDynamicSegment = false;

  for (const segment of segments) {
    path += `/${segment}`;
    const label = LABELS[segment];
    if (!label) {
      // An unlabelled segment is an id. The page names it, if it can.
      hasDynamicSegment = true;
      break;
    }
    crumbs.push({ to: path, label });
  }

  // On the dashboard the trail would be a single crumb pointing at the page
  // already open. Nothing to navigate, so render nothing.
  if (crumbs.length === 0 || (crumbs.length === 1 && crumbs[0]?.to === ROOT.to)) {
    return null;
  }

  const trail = [ROOT, ...crumbs];

  return (
    <nav aria-label="Breadcrumb" className="mb-md">
      <ol className="flex flex-wrap items-center gap-2xs text-body-sm">
        {trail.map((crumb, index) => {
          const isCurrent = index === trail.length - 1 && !hasDynamicSegment;
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

        {hasDynamicSegment && (
          <li className="flex items-center gap-2xs">
            <ChevronRight className="h-3 w-3 text-content-tertiary" aria-hidden />
            {detailTitle ? (
              <span
                aria-current="page"
                className="max-w-xs truncate text-content-primary"
              >
                {detailTitle}
              </span>
            ) : (
              <Skeleton className="h-4 w-32" />
            )}
          </li>
        )}
      </ol>
    </nav>
  );
}
