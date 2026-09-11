import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Headline metric tile, used by the Dashboard and the analytics screens.
 *
 * There is deliberately no trend indicator. `resolveRange` answers exactly one
 * window per request, so there is no previous period to compare against — every
 * delta the earlier designs carried was unbuildable (D5), and a percentage with
 * nothing behind it is worse than no percentage.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <Card className="flex items-start gap-sm p-md">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-text"
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <p className="text-body-sm text-content-secondary">{label}</p>
        {loading ? (
          <Skeleton className="mt-2xs h-7 w-20" />
        ) : (
          <p className="text-heading-xl text-content-primary">{value}</p>
        )}
        {hint && !loading && (
          <p className="mt-3xs text-body-sm text-content-tertiary">{hint}</p>
        )}
      </div>
    </Card>
  );
}
