import { Card } from '@/components/ui/Card';
import { formatCount } from '@/lib/format';
import type { BreakdownItem } from '@/types/models';

/**
 * Ranked `{ name, count }` list with a share bar — the shape every categorical
 * breakdown arrives in (referrers, devices, browsers, operating systems,
 * languages).
 *
 * One widget for all five rather than a donut for devices and lists elsewhere:
 * PROJECT_MASTER.md section 5 lists exactly one BreakdownList component, and a
 * ranked list is readable at 390px and legible to a screen reader, which a
 * donut is not.
 *
 * Names arrive already reduced to buckets — `chrome`, `windows`, `desktop`, a
 * referrer hostname, a primary language tag. Nothing here can identify a
 * visitor because nothing identifying was ever written (D2).
 */
export function BreakdownList({
  title,
  items,
  emptyLabel,
  formatName = (name) => name,
}: {
  title: string;
  items: BreakdownItem[];
  emptyLabel: string;
  formatName?: (name: string) => string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col p-md">
      <h3 className="text-heading-md">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-sm text-body-md text-content-tertiary">{emptyLabel}</p>
      ) : (
        <ol className="mt-sm flex flex-col gap-sm">
          {items.map((item) => {
            const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <li key={item.name} className="flex flex-col gap-3xs">
                <div className="flex items-baseline gap-xs">
                  <span className="min-w-0 flex-1 truncate text-body-md text-content-primary">
                    {formatName(item.name)}
                  </span>
                  <span className="text-body-md text-content-secondary">
                    {formatCount(item.count)}
                  </span>
                  <span className="w-10 text-right text-body-sm text-content-tertiary">
                    {share}%
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
