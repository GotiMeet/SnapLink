import { Link } from 'react-router-dom';
import { BarChart3, Folder, Link2, MoreVertical, PencilLine, Trash2 } from 'lucide-react';

import { DropdownMenu, MenuSeparator, menuItemClass } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/cn';
import { formatCount, formatRelative } from '@/lib/format';
import type { Project } from '@/types/models';

/**
 * One project in the catalog.
 *
 * `linkCount` and `totalVisits` are not fields on the project — the model has
 * only owner, title and deletedAt. Both are grouped client-side from a single
 * GET /urls by the page above (PROJECT_MASTER.md section 10).
 *
 * The card is not itself a link: it contains a menu, and nesting interactive
 * controls inside an anchor is invalid and breaks keyboard activation. The
 * title is the link, stretched over the card with a pseudo-element so the whole
 * surface stays clickable while the menu sits above it.
 */
export function ProjectCard({
  project,
  linkCount,
  totalVisits,
  onRename,
  onDelete,
}: {
  project: Project;
  linkCount: number;
  totalVisits: number;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative flex flex-col gap-md rounded-lg border border-border-subtle bg-surface-card p-md shadow-xs transition-colors hover:border-border-strong focus-within:border-primary-600">
      <div className="flex items-start justify-between gap-xs">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600"
        >
          <Folder className="h-5 w-5" />
        </span>

        <div className="relative z-10">
          <DropdownMenu
            label={`Actions for ${project.title}`}
            triggerClassName="rounded-md p-2xs text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
            trigger={
              <>
                <MoreVertical className="h-5 w-5" aria-hidden />
                <span className="sr-only">Actions for {project.title}</span>
              </>
            }
          >
            <button
              role="menuitem"
              type="button"
              onClick={onRename}
              className={menuItemClass}
            >
              <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
              Rename project
            </button>

            <MenuSeparator />

            <button
              role="menuitem"
              type="button"
              onClick={onDelete}
              className={cn(
                menuItemClass,
                'text-danger hover:bg-danger/10 hover:text-danger'
              )}
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              Move to Recycle Bin
            </button>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-w-0">
        <h2 className="text-heading-md">
          <Link
            to={`/app/projects/${project._id}`}
            className="rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            <span className="line-clamp-2 break-words">{project.title}</span>
          </Link>
        </h2>
        <p className="mt-3xs text-body-sm text-content-tertiary">
          Updated {formatRelative(project.updatedAt)}
        </p>
      </div>

      <dl className="flex items-center gap-md text-body-sm text-content-secondary">
        <div className="flex items-center gap-2xs">
          <Link2 className="h-4 w-4 text-content-tertiary" aria-hidden />
          <dt className="sr-only">Links</dt>
          <dd>
            {formatCount(linkCount)} {linkCount === 1 ? 'link' : 'links'}
          </dd>
        </div>
        <div className="flex items-center gap-2xs">
          <BarChart3 className="h-4 w-4 text-content-tertiary" aria-hidden />
          <dt className="sr-only">Visits</dt>
          <dd>
            {formatCount(totalVisits)} {totalVisits === 1 ? 'visit' : 'visits'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
