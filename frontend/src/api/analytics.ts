/**
 * Analytics endpoints.
 *
 * Only the composite report is used. The per-section endpoints return subsets
 * of the same payload, and languages have no endpoint of their own — they exist
 * only on the composite (PROJECT_MASTER.md section 4). Fetching the parts
 * separately would be five requests for one screen and would still need this
 * one for languages.
 */

import { request } from '@/lib/api';
import type { DateRange } from '@/lib/dates';
import type { AnalyticsReport } from '@/types/models';

export const getLinkAnalytics = ({ urlId, from, to }: { urlId: string } & DateRange) =>
  request<{ analytics: AnalyticsReport }>(`/analytics/${urlId}`, {
    params: { from, to },
  }).then((data) => data.analytics);
