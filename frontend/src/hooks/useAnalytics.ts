import { useQuery } from '@tanstack/react-query';

import { getLinkAnalytics } from '@/api/analytics';
import type { DateRange } from '@/lib/dates';

/** Key shape from PROJECT_MASTER.md section 10: ['analytics', urlId, from, to]. */
const analyticsKeys = {
  link: (urlId: string, range: DateRange) =>
    ['analytics', urlId, range.from, range.to] as const,
};

export function useLinkAnalytics(urlId: string | undefined, range: DateRange) {
  return useQuery({
    queryKey: analyticsKeys.link(urlId ?? '', range),
    queryFn: () => getLinkAnalytics({ urlId: urlId as string, ...range }),
    enabled: Boolean(urlId),
    // Keeps the previous window on screen while a new one loads, so switching
    // presets does not blank the page and re-shift its layout.
    placeholderData: (previous) => previous,
  });
}
