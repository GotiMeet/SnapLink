import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Plus, SearchX } from 'lucide-react';

import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { DeleteProjectDialog } from '@/components/projects/DeleteProjectDialog';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { RenameProjectModal } from '@/components/projects/RenameProjectModal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProjects } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import type { Project, ShortUrl } from '@/types/models';
import { usePageMeta } from '@/hooks/usePageMeta';

type SortKey = 'updated' | 'title';

/**
 * Reduces one GET /urls into per-project totals.
 *
 * There is no endpoint that returns a project's link count or visit total — the
 * Project model carries neither — so both are grouped here from the link list
 * the workspace already needs. PROJECT_MASTER.md section 16 accepts this for v1
 * and tracks the aggregate endpoint as roadmap H1.
 */
function totalsByProject(urls: ShortUrl[] | undefined) {
  const totals = new Map<string, { linkCount: number; totalVisits: number }>();
  if (!urls) return totals;

  for (const url of urls) {
    const current = totals.get(url.project) ?? { linkCount: 0, totalVisits: 0 };
    current.linkCount += 1;
    current.totalVisits += url.clickCount;
    totals.set(url.project, current);
  }

  return totals;
}

/** SCR-AUTH-02. */
export function ProjectsPage() {
  usePageMeta({ title: 'Projects', noindex: true });
  const navigate = useNavigate();

  const projectsQuery = useProjects();
  // Counts only. A failure here must not blank the catalog, so it is never
  // treated as a page-level error — the cards fall back to zero.
  const urlsQuery = useUrls();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const totals = useMemo(() => totalsByProject(urlsQuery.data), [urlsQuery.data]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = projectsQuery.data ?? [];

    const filtered = term
      ? rows.filter((project) => project.title.toLowerCase().includes(term))
      : rows;

    // The API already sorts by updatedAt desc, so only the alphabetical option
    // needs to re-order. Copy first: the query cache's array is not ours.
    return sort === 'title'
      ? [...filtered].sort((a, b) => a.title.localeCompare(b.title))
      : filtered;
  }, [projectsQuery.data, search, sort]);

  const projectCount = projectsQuery.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <h1 className="text-heading-xl">Projects</h1>
          {projectsQuery.isSuccess && (
            <span className="rounded-full bg-surface-subtle px-xs py-3xs text-label-md text-content-secondary">
              {projectCount} active
            </span>
          )}
        </div>

        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          New project
        </Button>
      </header>

      {projectsQuery.isError && (
        <Alert
          tone="danger"
          title="Failed to load projects"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => projectsQuery.refetch()}
              loading={projectsQuery.isFetching}
            >
              Try again
            </Button>
          }
        >
          <p>Please try refreshing.</p>
        </Alert>
      )}

      {projectsQuery.isPending && (
        <>
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[148px] w-full rounded-lg" />
            ))}
          </div>
        </>
      )}

      {projectsQuery.isSuccess && projectCount === 0 && (
        <EmptyState
          icon={<FolderPlus className="h-8 w-8" aria-hidden />}
          title="No projects yet"
          description="Projects keep your links organised by client, social platform, or marketing campaign."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Create your first project
            </Button>
          }
        />
      )}

      {projectsQuery.isSuccess && projectCount > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-md">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <Input
                label="Search projects"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title"
              />
            </div>

            <label className="flex flex-col gap-2xs">
              <span className="text-label-lg text-content-primary">Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="h-10 rounded-md border border-border-subtle bg-surface-card px-sm text-body-md text-content-primary focus:outline-none focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20"
              >
                <option value="updated">Recently updated</option>
                <option value="title">Alphabetical</option>
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-8 w-8" aria-hidden />}
              title="No matching projects found"
              description="Clear your search term to see all projects."
              action={
                <Button variant="secondary" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <>
              {/* Result count for assistive tech, which cannot see the grid shrink. */}
              <p aria-live="polite" className="sr-only">
                {visible.length} of {projectCount} projects shown
              </p>

              <ul className="grid list-none gap-md sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((project) => {
                  const total = totals.get(project._id);
                  return (
                    <li key={project._id}>
                      <ProjectCard
                        project={project}
                        linkCount={total?.linkCount ?? 0}
                        totalVisits={total?.totalVisits ?? 0}
                        onRename={() => setRenaming(project)}
                        onDelete={() => setDeleting(project)}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}

      <CreateProjectModal
        open={creating}
        onOpenChange={setCreating}
        onCreated={(projectId) => navigate(`/app/projects/${projectId}`)}
      />

      <RenameProjectModal
        project={renaming}
        onOpenChange={(open) => !open && setRenaming(null)}
      />

      <DeleteProjectDialog
        project={deleting}
        linkCount={deleting ? (totals.get(deleting._id)?.linkCount ?? 0) : 0}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
