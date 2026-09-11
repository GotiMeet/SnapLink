import { useQuery } from '@tanstack/react-query';

import { getProject, listProjects } from '@/api/projects';

/**
 * Query keys from PROJECT_MASTER.md section 10. Kept beside the hooks that use
 * them so an invalidation elsewhere cannot drift from the key a query registers
 * under — a mismatch there fails silently, leaving a stale list on screen.
 */
const projectKeys = {
  list: (deleted: boolean) => ['projects', { deleted }] as const,
  detail: (projectId: string) => ['projects', projectId] as const,
};

/** The owner's projects, newest-updated first (the order the API returns). */
export function useProjects(deleted = false) {
  return useQuery({
    queryKey: projectKeys.list(deleted),
    queryFn: () => listProjects(deleted),
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => getProject(projectId as string),
    enabled: Boolean(projectId),
  });
}
