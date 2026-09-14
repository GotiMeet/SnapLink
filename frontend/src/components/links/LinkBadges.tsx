import { Clock, Lock } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDateShort } from '@/lib/format';
import type { ShortUrl } from '@/types/models';

/**
 * Status and visibility are independent (PROJECT_MASTER.md section 4): a link
 * can be Scheduled *and* Protected. They render as two separate badges and are
 * never collapsed into one column.
 *
 * Only `active` and `inactive` can reach these screens. `deleted_link` lives in
 * the Recycle Bin, and `deleted_project` is invisible everywhere until its
 * project comes back.
 */
export function LinkStatusBadge({ link }: { link: ShortUrl }) {
  if (link.status === 'inactive') {
    return (
      <Badge
        tone="warning"
        icon={<Clock className="h-3 w-3" aria-hidden />}
        title={
          link.scheduledLiveAt
            ? `Goes live ${formatDate(link.scheduledLiveAt)}`
            : undefined
        }
      >
        {link.scheduledLiveAt
          ? `Live ${formatDateShort(link.scheduledLiveAt)}`
          : 'Scheduled'}
      </Badge>
    );
  }

  return <Badge tone="success">Active</Badge>;
}

export function LinkVisibilityBadge({ link }: { link: ShortUrl }) {
  if (link.visibility !== 'private') return null;

  return (
    <Badge tone="accent" icon={<Lock className="h-3 w-3" aria-hidden />}>
      Protected
    </Badge>
  );
}
