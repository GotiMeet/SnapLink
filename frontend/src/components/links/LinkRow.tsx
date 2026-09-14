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
 * 40px on touch, 36px from `md`.
 *
 * These were 24x24 buttons sitting 2px apart. WCAG 2.5.8 admits a 24px target
 * only when it is adequately spaced, which 2px is not — and the overflow menu
 * beside them contains "Move to Recycle Bin", so a mis-tap was one further tap
 * from deleting a link.
 */
const actionButtonClass =
  'flex h-10 w-10 items-center justify-center rounded-md text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary md:h-9 md:w-9';

/**
 * One link in the catalog.
 *
 * Rendered as a card that reflows rather than a `<table>`: PROJECT_MASTER.md
 * section 7 requires the table to collapse to stacked cards below 768px, and a
 * single flex layout that reflows is simpler and more accessible than a table
 * plus a duplicate card list for narrow screens.
 *
 * The two layouts are genuinely different, not the same one with classes
 * dropped. Below `md` the row is a stacked card: identity, address, badges,
 * then a footer line pairing the figures with the actions. Above it, the same
 * pieces sit in fixed columns that line up from row to row. An earlier version
 * simply removed the `md:` modifiers, which left the count and the actions at
 * opposite ends of a `justify-between` row with the whole viewport between them.
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

  const actions = (
    <div className="flex shrink-0 items-center gap-2xs">
      <button
        type="button"
        onClick={onShowQr}
        aria-label={`QR code for ${link.title}`}
        title="QR code"
        className={actionButtonClass}
      >
        <QrCode className="h-4 w-4" aria-hidden />
      </button>

      <Link
        to={`/app/links/${link._id}/analytics`}
        aria-label={`Analytics for ${link.title}`}
        title="Analytics"
        className={actionButtonClass}
      >
        <BarChart3 className="h-4 w-4" aria-hidden />
      </Link>

      <DropdownMenu
        label={`Actions for ${link.title}`}
        triggerClassName={actionButtonClass}
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
        <button role="menuitem" type="button" onClick={onShowQr} className={menuItemClass}>
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
            'text-danger-text hover:bg-danger/10 hover:text-danger-text'
          )}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          Move to Recycle Bin
        </button>
      </DropdownMenu>
    </div>
  );

  const badges = (
    <>
      <LinkStatusBadge link={link} />
      <LinkVisibilityBadge link={link} />
    </>
  );

  const projectChip = projectTitle ? (
    <Link
      to={`/app/projects/${link.project}`}
      className="max-w-[12rem] truncate rounded-sm bg-surface-subtle px-xs py-3xs text-body-sm text-content-secondary hover:text-content-primary"
    >
      {projectTitle}
    </Link>
  ) : null;

  return (
    <div className="p-md">
      {/* ---------- stacked card, below md ---------- */}
      <div className="flex flex-col gap-xs md:hidden">
        <Link
          to={`/app/links/${link._id}`}
          className="min-w-0 rounded-sm text-label-lg text-content-primary hover:text-primary-text"
        >
          <span className="line-clamp-2">{link.title}</span>
        </Link>

        <div className="flex min-w-0 items-center gap-xs">
          <span className="truncate font-mono text-mono-code text-primary-text">
            {shortLinkHost}/{link.shortCode}
          </span>
          <CopyButton value={shortUrl} label="short link" />
        </div>

        <a
          href={link.originalUrl}
          target="_blank"
          // The destination is user-supplied; the opened page must not get a
          // handle on this one (PROJECT_MASTER.md section 13, rule 10).
          rel="noopener noreferrer"
          title={link.originalUrl}
          className="flex min-w-0 items-center gap-3xs rounded-sm text-body-sm text-content-tertiary hover:text-content-primary"
        >
          <span className="truncate">{link.originalUrl}</span>
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
        </a>

        <div className="flex flex-wrap items-center gap-xs">
          {badges}
          {projectChip}
        </div>

        {/*
          Figures and actions share one line. As two separate blocks they sat at
          opposite ends of an otherwise empty row; as a single inline string the
          left side has enough content to balance the controls, and the
          last-updated time — previously hidden below `lg` — comes back.
        */}
        <div className="mt-3xs flex items-center justify-between gap-xs border-t border-border-subtle pt-xs">
          <p className="min-w-0 truncate text-body-sm text-content-secondary">
            <span className="text-label-lg text-content-primary">
              {formatCount(link.clickCount)}
            </span>{' '}
            {link.clickCount === 1 ? 'visit' : 'visits'}
            <span className="text-content-tertiary">
              {' · '}
              {formatRelative(link.updatedAt)}
            </span>
          </p>
          {actions}
        </div>
      </div>

      {/* ---------- columnar, md and up ---------- */}
      <div className="hidden md:flex md:items-center md:gap-md">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-xs">
            <Link
              to={`/app/links/${link._id}`}
              className="min-w-0 rounded-sm text-label-lg text-content-primary hover:text-primary-text"
            >
              {/*
                Truncated rather than wrapped. A wrapping title pushed the
                project chip onto a second line on some rows and not others,
                which is what made the catalog's row heights ragged.
              */}
              <span className="block truncate">{link.title}</span>
            </Link>
            {projectChip}
          </div>

          <div className="mt-2xs flex min-w-0 items-center gap-xs">
            <span className="shrink-0 font-mono text-mono-code text-primary-text">
              {shortLinkHost}/{link.shortCode}
            </span>
            <CopyButton value={shortUrl} label="short link" />
            <a
              href={link.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={link.originalUrl}
              className="flex min-w-0 items-center gap-3xs rounded-sm text-body-sm text-content-tertiary hover:text-content-primary"
            >
              <span className="truncate">{link.originalUrl}</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </a>
          </div>
        </div>

        {/*
          Wide enough for "Live 17 Sep 2026" beside "Protected". At the previous
          w-48 that pair wrapped to a second line, making scheduled rows taller
          than every other row.
        */}
        <div className="flex w-56 shrink-0 flex-wrap items-center gap-xs">{badges}</div>

        <p className="w-20 shrink-0 text-right">
          <span className="block text-label-lg tabular-nums text-content-primary">
            {formatCount(link.clickCount)}
          </span>
          <span className="block text-body-sm text-content-tertiary">
            {link.clickCount === 1 ? 'visit' : 'visits'}
          </span>
        </p>

        <p className="hidden w-28 shrink-0 text-right text-body-sm text-content-tertiary lg:block">
          {formatRelative(link.updatedAt)}
        </p>

        {actions}
      </div>
    </div>
  );
}
