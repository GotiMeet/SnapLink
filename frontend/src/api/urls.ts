/**
 * Short-URL endpoints.
 *
 * Only the list is here. The rest of the surface — create, update, alias
 * availability, QR, delete, restore — arrives with the screens that use it.
 *
 * `GET /urls?deleted=false` returns active and scheduled links; `deleted=true`
 * returns only links the owner deleted. A link whose parent project is deleted
 * (`deleted_project`) appears in neither, and returns automatically when the
 * project is restored (PROJECT_MASTER.md section 4).
 */

import { request } from '@/lib/api';
import type { ShortUrl } from '@/types/models';

export const listUrls = ({
  projectId,
  deleted = false,
}: { projectId?: string; deleted?: boolean } = {}) =>
  request<{ shortUrls: ShortUrl[] }>('/urls', {
    params: { projectId, deleted },
  }).then((data) => data.shortUrls);
