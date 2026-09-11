import { Link2 } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * Wordmark only. PROJECT_MASTER.md section 8 is explicit that there is no
 * sub-brand label under the logo — earlier designs carried several competing
 * ones ("Enterprise Hub", "Workspace") that contradict the product's positioning.
 */
export function BrandMark({ compact = false }: { compact?: boolean } = {}) {
  return (
    <span className="flex items-center gap-xs">
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white"
      >
        <Link2 className="h-5 w-5" />
      </span>
      {/*
        The top bar runs out of room at 375px once "+ Create", the theme toggle
        and the account menu are all present, so the wordmark yields there and
        the mark alone carries the brand. Every other placement keeps it.
      */}
      <span
        className={cn(
          'font-heading text-heading-md text-content-primary',
          compact && 'hidden sm:inline'
        )}
      >
        SnapLink
      </span>
    </span>
  );
}
