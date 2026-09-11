/**
 * Short-URL endpoints.
 *
 * `GET /urls?deleted=false` returns active and scheduled links; `deleted=true`
 * returns only links the owner deleted. A link whose parent project is deleted
 * (`deleted_project`) appears in neither, and returns automatically when the
 * project is restored (PROJECT_MASTER.md section 4).
 */

import { request, requestBlob } from '@/lib/api';
import type { ShortUrl, Visibility } from '@/types/models';

export const listUrls = ({
  projectId,
  deleted = false,
}: { projectId?: string; deleted?: boolean } = {}) =>
  request<{ shortUrls: ShortUrl[] }>('/urls', {
    params: { projectId, deleted },
  }).then((data) => data.shortUrls);

export const getUrl = (urlId: string) =>
  request<{ shortUrl: ShortUrl }>(`/urls/${urlId}`).then((data) => data.shortUrl);

export interface CreateUrlBody {
  projectId: string;
  title: string;
  originalUrl: string;
  visibility?: Visibility;
  customAlias?: string;
  /** Required when visibility is private, rejected otherwise. 6-72 characters. */
  password?: string;
  confirmPassword?: string;
  scheduledLiveAt?: string;
  scheduledDeleteAt?: string;
}

export const createUrl = (body: CreateUrlBody) =>
  request<{ shortUrl: ShortUrl }>('/urls', { method: 'POST', body }).then(
    (data) => data.shortUrl
  );

/**
 * Every field is optional and omitted fields are left alone, so the caller
 * sends only what changed.
 *
 * Two asymmetries worth knowing:
 *  - `scheduledLiveAt: null` clears a schedule; omitting it leaves it in place.
 *  - Setting `visibility: 'public'` drops the stored password server-side, and
 *    setting `'private'` without ever having set one is refused with a 400.
 */
export interface UpdateUrlBody {
  title?: string;
  originalUrl?: string;
  customAlias?: string;
  visibility?: Visibility;
  password?: string;
  confirmPassword?: string;
  scheduledLiveAt?: string | null;
  scheduledDeleteAt?: string | null;
  resetAnalytics?: boolean;
  /** Must be exactly "RESET_ANALYTICS" whenever resetAnalytics is true. */
  confirmationText?: string;
}

export const updateUrl = ({ urlId, ...body }: UpdateUrlBody & { urlId: string }) =>
  request<{ shortUrl: ShortUrl }>(`/urls/${urlId}`, { method: 'PATCH', body }).then(
    (data) => data.shortUrl
  );

export const deleteUrl = (urlId: string) =>
  request<{ shortUrl: ShortUrl }>(`/urls/${urlId}`, { method: 'DELETE' }).then(
    (data) => data.shortUrl
  );

/**
 * Restores a link the owner deleted. Refused with a 409 when the link's project
 * is itself deleted — the error carries that project so the client can name it.
 */
export const restoreUrl = (urlId: string) =>
  request<{ shortUrl: ShortUrl }>(`/urls/${urlId}/restore`, { method: 'PATCH' }).then(
    (data) => data.shortUrl
  );

/**
 * Advisory only. The alias is claimed by POST /urls, which answers 409 if it was
 * taken in between — this exists to tell the user before they submit, never to
 * decide whether the submit is allowed.
 */
export const checkAliasAvailability = (alias: string) =>
  request<{ alias: string; available: boolean }>(
    `/urls/alias-availability/${encodeURIComponent(alias)}`
  );

/** The one endpoint answering with binary PNG instead of the JSON envelope. */
export const getQrBlob = (urlId: string) => requestBlob(`/urls/${urlId}/qr`);
