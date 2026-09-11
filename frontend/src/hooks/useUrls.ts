import { useQuery } from '@tanstack/react-query';

import { getUrl, listUrls } from '@/api/urls';

const urlKeys = {
  list: (params: { projectId?: string; deleted?: boolean }) =>
    ['urls', { projectId: params.projectId, deleted: params.deleted ?? false }] as const,
  detail: (urlId: string) => ['urls', urlId] as const,
};

/**
 * The owner's links, optionally scoped to one project.
 *
 * Every workspace figure the product shows — total visits, QR share, links per
 * project, top link — is reduced from this one response rather than fetched.
 * There is no aggregate endpoint, and PROJECT_MASTER.md section 16 accepts that
 * for v1 at this scale.
 */
export function useUrls(
  params: { projectId?: string; deleted?: boolean } = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: urlKeys.list(params),
    queryFn: () => listUrls(params),
    enabled: options.enabled ?? true,
  });
}

export function useUrl(urlId: string | undefined) {
  return useQuery({
    queryKey: urlKeys.detail(urlId ?? ''),
    queryFn: () => getUrl(urlId as string),
    enabled: Boolean(urlId),
  });
}
