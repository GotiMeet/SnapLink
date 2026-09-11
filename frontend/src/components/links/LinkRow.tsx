import { Link } from 'react-router-dom';
import {
  BarChart3,
  ExternalLink,
  MoreVertical,
  PencilLine,
  QrCode,
  Trash2,
} from 'lucide-react';

import { DropdownMenu, MenuSeparator, menuItemClass } from '@/components/ui/DropdownMenu';
import { env } from '@/env';
import { cn } from '@/lib/cn';
import { formatCount, formatRelative } from '@/lib/format';
import { CopyButton } from './CopyButton';
import { LinkStatusBadge, LinkVisibilityBadge } from './LinkBadges';
import type { ShortUrl } from '@/types/models';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

/**
 * One link in the catalog.
 *
 * Rendered as a card that reflows rather than a `<table>`: PROJECT_MASTER.md
 * section 7 requires the table to collapse to stacked cards below 768px, and a
 * single flex layout that reflows is simpler and more accessible than a table
 * plus a duplicate card list for narrow screens.
 *
 * The row is not an anchor. It contains a copy button, a QR button and a menu,
 * and nesting those inside a link is invalid HTML and breaks keyboard
 * activation. The title is the link instead.
 */
export function LinkRow({
  link,
  projectTitle,
  onShowQr,
  onDelete,
}: {
  link: ShortUrl;
  projectTitle?: string;
  onShowQr: () => void;
  onDelete: () => void;
}) {
  const shortUrl = `${env.appUrl}/${link.shortCode}`;

  return (
    <div className="flex flex-col gap-sm p-md md:flex-row md:items-center md:gap-md">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-xs">
          <Link
            to={`/app/links/${link._id}`}
            className="min-w-0 rounded-sm text-label-lg text-content-primary hover:text-primary-600"
          >
            <span className="line-clamp-1 break-all">{link.title}</span>
          </Link>
          {projectTitle && (
            <Link
              to={`/app/projects/${link.project}`}
              className="rounded-sm bg-surface-subtle px-xs py-3xs text-body-sm text-content-secondary hover:text-content-primary"
            >
              {projectTitle}
            </Link>
          )}
        </div>

        <div className="mt-2xs flex flex-wrap items-center gap-xs">
          <span className="font-mono text-mono-code text-primary-600">
            {shortLinkHost}/{link.shortCode}
          </span>
          <CopyButton value={shortUrl} label="short link" />
          <a
            href={link.originalUrl}
            target="_blank"
            // The destination is user-supplied; the opened page must not get a
            // handle on this one (PROJECT_MASTER.md section 13, rule 10).
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-3xs rounded-sm text-body-sm text-content-tertiary hover:text-content-primary"
          >
            <span className="line-clamp-1 break-all">{link.originalUrl}</span>
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-xs md:w-48 md:shrink-0">
        <LinkStatusBadge link={link} />
        <LinkVisibilityBadge link={link} />
      </div>

      <div className="flex items-center justify-between gap-xs md:w-auto">
        <p className="text-right md:w-24">
          <span className="block text-label-lg text-content-primary">
            {formatCount(link.clickCount)}
          </span>
          <span className="block text-body-sm text-content-tertiary">
            {link.clickCount === 1 ? 'visit' : 'visits'}
          </span>
        </p>

        <p className="hidden w-28 text-right text-body-sm text-content-tertiary lg:block">
          {formatRelative(link.updatedAt)}
        </p>

        <div className="flex items-center gap-3xs">
          <button
            type="button"
            onClick={onShowQr}
            aria-label={`QR code for ${link.title}`}
            title="QR code"
            className="rounded-md p-2xs text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
          >
            <QrCode className="h-4 w-4" aria-hidden />
          </button>

          <Link
            to={`/app/links/${link._id}/analytics`}
            aria-label={`Analytics for ${link.title}`}
            title="Analytics"
            className="rounded-md p-2xs text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
          </Link>

          <DropdownMenu
            label={`Actions for ${link.title}`}
            triggerClassName="rounded-md p-2xs text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
            trigger={
              <>
                <MoreVertical className="h-4 w-4" aria-hidden />
                <span className="sr-only">Actions for {link.title}</span>
              </>
            }
          >
            <Link role="menuitem" to={`/app/links/${link._id}`} className={menuItemClass}>
              <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
              Edit link
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={onShowQr}
              className={menuItemClass}
            >
              <QrCode className="h-4 w-4 shrink-0" aria-hidden />
              QR code
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
    </div>
  );
}
