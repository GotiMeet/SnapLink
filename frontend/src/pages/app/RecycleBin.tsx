import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArchiveRestore, Folder, FolderX, Link2, SearchX, Trash2 } from 'lucide-react';

import { restoreProject } from '@/api/projects';
import { restoreUrl } from '@/api/urls';
import { RestoreConflictModal } from '@/components/recycle-bin/RestoreConflictModal';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { env } from '@/env';
import { useProjects } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import { ApiError } from '@/lib/api';
import { formatCount, formatRelative } from '@/lib/format';
import type { Project, ShortUrl } from '@/types/models';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

type TabId = 'links' | 'projects';

const RETENTION_COPY = 'Deleted links and projects stay here until you restore them.';

interface ConflictState {
  linkTitle: string;
  projectTitle: string | null;
}

/**
 * SCR-AUTH-10A / 10B / 10-M1 / 10-EMPTY.
 *
 * Restore is the only action. v1 has no hard-delete path anywhere in the
 * backend, so there is no "Empty Recycle Bin", no permanent delete, and no
 * retention countdown — the copy states indefinite retention plainly instead
 * (D4, PROJECT_MASTER.md section 9).
 *
 * There is also no deletion-reason badge. `GET /urls?deleted=true` returns only
 * `deleted_link`; a link taken offline by its parent project is `deleted_project`
 * and appears in no list at all until that project is restored, so the badge
 * would never have a second value to show.
 */
export function RecycleBinPage() {
  const [params, setParams] = useSearchParams();
  const tab: TabId = params.get('tab') === 'projects' ? 'projects' : 'links';

  const [search, setSearch] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  /** Row id to failure message, for refusals that are not the project conflict. */
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const deletedLinksQuery = useUrls({ deleted: true });
  const deletedProjectsQuery = useProjects(true);
  // A deleted link's parent may still be live, so both project lists are needed
  // to name it — and to warn, before the click, when the parent is itself gone.
  const activeProjectsQuery = useProjects();

  const projectTitles = useMemo(() => {
    const titles = new Map<string, { title: string; deleted: boolean }>();
    for (const project of activeProjectsQuery.data ?? []) {
      titles.set(project._id, { title: project.title, deleted: false });
    }
    for (const project of deletedProjectsQuery.data ?? []) {
      titles.set(project._id, { title: project.title, deleted: true });
    }
    return titles;
  }, [activeProjectsQuery.data, deletedProjectsQuery.data]);

  const clearRowError = (id: string) =>
    setRowErrors((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });

  /**
   * Restoring a link and restoring a project both move items between the live
   * and deleted lists, so every cached view of either is stale afterwards.
   */
  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['urls'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ]);

  /*
   * Deliberately not optimistic. A restore has three distinct refusals — the
   * parent project is deleted, the title was claimed inside that project while
   * this link sat here, or the alias was taken — and none can be predicted from
   * the cached row. Removing the row first would mean putting it back on two
   * of those paths, with the conflict modal arguing about an item that had
   * already vanished from the list.
   */
  const restoreLinkMutation = useMutation({
    mutationFn: restoreUrl,
    onMutate: (urlId: string) => {
      setRestoringId(urlId);
      clearRowError(urlId);
    },
    onSuccess: async (link) => {
      await invalidateAll();
      toast.success(`“${link.title}” restored`);
    },
    onError: (error, urlId) => {
      if (!(error instanceof ApiError)) {
        toast.error('Unable to reach SnapLink. Check your connection and try again.');
        return;
      }

      // The one refusal with a next step the user can take from here. The
      // project travels in the 409 so the modal can name it.
      const projectError = error.errors.find((entry) => entry.project);
      if (error.isConflict && projectError) {
        const link = deletedLinksQuery.data?.find((row) => row._id === urlId);
        setConflict({
          linkTitle: link?.title ?? 'This link',
          projectTitle: projectError.project?.title ?? null,
        });
        return;
      }

      // Everything else — a title or alias claimed while this sat deleted, or a
      // 404 — is reported as sent, on the row it belongs to.
      setRowErrors((current) => ({ ...current, [urlId]: error.message }));
    },
    onSettled: () => setRestoringId(null),
  });

  const restoreProjectMutation = useMutation({
    mutationFn: restoreProject,
    onMutate: (projectId: string) => {
      setRestoringId(projectId);
      clearRowError(projectId);
    },
    onSuccess: async (project) => {
      await invalidateAll();
      toast.success(`“${project.title}” restored`, {
        description: 'Links it had taken offline are back too.',
      });
    },
    onError: (error, projectId) => {
      if (!(error instanceof ApiError)) {
        toast.error('Unable to reach SnapLink. Check your connection and try again.');
        return;
      }
      setRowErrors((current) => ({ ...current, [projectId]: error.message }));
    },
    onSettled: () => setRestoringId(null),
  });

  // Memoised because `?? []` would hand the filters below a fresh array on
  // every render, which defeats their own memos.
  const links = useMemo(() => deletedLinksQuery.data ?? [], [deletedLinksQuery.data]);
  const projects = useMemo(
    () => deletedProjectsQuery.data ?? [],
    [deletedProjectsQuery.data]
  );

  const term = search.trim().toLowerCase();
  const visibleLinks = useMemo(
    () =>
      term
        ? links.filter(
            (link) =>
              link.title.toLowerCase().includes(term) ||
              link.shortCode.toLowerCase().includes(term)
          )
        : links,
    [links, term]
  );
  const visibleProjects = useMemo(
    () =>
      term ? projects.filter((p) => p.title.toLowerCase().includes(term)) : projects,
    [projects, term]
  );

  const loading = deletedLinksQuery.isPending || deletedProjectsQuery.isPending;
  const failed = deletedLinksQuery.isError || deletedProjectsQuery.isError;
  const isEmpty =
    deletedLinksQuery.isSuccess &&
    deletedProjectsQuery.isSuccess &&
    links.length === 0 &&
    projects.length === 0;

  const switchTab = (next: TabId) => {
    setParams(next === 'projects' ? { tab: 'projects' } : {}, { replace: true });
  };

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-2xs">
        <h1 className="text-heading-xl">Recycle Bin</h1>
        <p className="text-body-md text-content-secondary">{RETENTION_COPY}</p>
      </header>

      {failed && (
        <Alert
          tone="danger"
          title="Failed to load the Recycle Bin"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                deletedLinksQuery.refetch();
                deletedProjectsQuery.refetch();
              }}
              loading={deletedLinksQuery.isFetching || deletedProjectsQuery.isFetching}
            >
              Try again
            </Button>
          }
        >
          <p>Please try again in a moment.</p>
        </Alert>
      )}

      {loading && (
        <>
          <Skeleton className="h-10 w-full max-w-sm" />
          <Card className="divide-y divide-border-subtle">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="p-md">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </Card>
        </>
      )}

      {isEmpty && (
        <EmptyState
          icon={<Trash2 className="h-8 w-8" aria-hidden />}
          title="Your Recycle Bin is empty"
          description={RETENTION_COPY}
        />
      )}

      {!loading && !isEmpty && (
        <>
          <Tabs<TabId>
            label="Recycle Bin sections"
            active={tab}
            onChange={switchTab}
            tabs={[
              {
                id: 'links',
                label: 'Deleted Links',
                badge: <CountChip value={links.length} />,
              },
              {
                id: 'projects',
                label: 'Deleted Projects',
                badge: <CountChip value={projects.length} />,
              },
            ]}
          />

          <div className="min-w-0 sm:max-w-sm">
            <Input
              label="Search the Recycle Bin"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tab === 'links' ? 'Title or short code' : 'Project title'}
            />
          </div>

          {/* A screen reader cannot see the list shrink as the term changes. */}
          <p aria-live="polite" className="sr-only">
            {tab === 'links'
              ? `${visibleLinks.length} of ${links.length} deleted links shown`
              : `${visibleProjects.length} of ${projects.length} deleted projects shown`}
          </p>

          <TabPanel id={tab}>
            {tab === 'links' ? (
              <DeletedLinks
                links={visibleLinks}
                total={links.length}
                deletedProjectCount={projects.length}
                search={term}
                onClearSearch={() => setSearch('')}
                projectTitles={projectTitles}
                rowErrors={rowErrors}
                restoringId={restoringId}
                onRestore={(id) => restoreLinkMutation.mutate(id)}
              />
            ) : (
              <DeletedProjects
                projects={visibleProjects}
                total={projects.length}
                search={term}
                onClearSearch={() => setSearch('')}
                rowErrors={rowErrors}
                restoringId={restoringId}
                onRestore={(id) => restoreProjectMutation.mutate(id)}
              />
            )}
          </TabPanel>
        </>
      )}

      <RestoreConflictModal
        open={conflict !== null}
        linkTitle={conflict?.linkTitle ?? ''}
        projectTitle={conflict?.projectTitle ?? null}
        onOpenChange={(open) => !open && setConflict(null)}
        onGoToProjects={() => {
          setConflict(null);
          setSearch('');
          switchTab('projects');
        }}
      />
    </div>
  );
}

function CountChip({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-surface-subtle px-xs py-3xs text-label-md text-content-secondary">
      {formatCount(value)}
    </span>
  );
}

function DeletedLinks({
  links,
  total,
  deletedProjectCount,
  search,
  onClearSearch,
  projectTitles,
  rowErrors,
  restoringId,
  onRestore,
}: {
  links: ShortUrl[];
  total: number;
  deletedProjectCount: number;
  search: string;
  onClearSearch: () => void;
  projectTitles: Map<string, { title: string; deleted: boolean }>;
  rowErrors: Record<string, string>;
  restoringId: string | null;
  onRestore: (id: string) => void;
}) {
  /*
   * PROJECT_MASTER.md section 16 requires this to be explained here. A link
   * taken offline by deleting its project is `deleted_project`, which
   * GET /urls?deleted=true does not return — so those links are in no list at
   * all, and someone looking for them would otherwise conclude they were lost.
   * Only shown when a deleted project exists, because that is the only way such
   * a link can exist.
   */
  const cascadeNote = deletedProjectCount > 0 && (
    <Alert tone="info">
      Links that went offline because you deleted their project are not listed here. They
      come back on their own when you restore that project.
    </Alert>
  );

  if (total === 0) {
    return (
      <div className="flex flex-col gap-md">
        {cascadeNote}
        <Card className="p-lg">
          <EmptyState
            icon={<Link2 className="h-8 w-8" aria-hidden />}
            title="No deleted links"
            description="Links you delete land here, and stay until you restore them."
          />
        </Card>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col gap-md">
        {cascadeNote}
        <NoMatches onClearSearch={onClearSearch} term={search} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {cascadeNote}
      <Card className="divide-y divide-border-subtle">
        {links.map((link) => {
          const parent = projectTitles.get(link.project);
          return (
            <RestoreRow
              key={link._id}
              title={link.title}
              deletedAt={link.deletedAt}
              error={rowErrors[link._id]}
              restoring={restoringId === link._id}
              onRestore={() => onRestore(link._id)}
              meta={
                <>
                  <span className="font-mono text-mono-code text-content-secondary">
                    {shortLinkHost}/{link.shortCode}
                  </span>
                  {parent && (
                    <span className="flex items-center gap-3xs text-body-sm text-content-tertiary">
                      <Folder className="h-3 w-3" aria-hidden />
                      {parent.title}
                    </span>
                  )}
                  {parent?.deleted && (
                    /*
                     * A heads-up, not a gate. The button stays enabled and the
                     * backend still decides — its 409 is what names the project
                     * in the conflict modal.
                     */
                    <Badge
                      tone="warning"
                      icon={<FolderX className="h-3 w-3" aria-hidden />}
                    >
                      Project deleted
                    </Badge>
                  )}
                </>
              }
            />
          );
        })}
      </Card>
    </div>
  );
}

function DeletedProjects({
  projects,
  total,
  search,
  onClearSearch,
  rowErrors,
  restoringId,
  onRestore,
}: {
  projects: Project[];
  total: number;
  search: string;
  onClearSearch: () => void;
  rowErrors: Record<string, string>;
  restoringId: string | null;
  onRestore: (id: string) => void;
}) {
  if (total === 0) {
    return (
      <Card className="p-lg">
        <EmptyState
          icon={<Folder className="h-8 w-8" aria-hidden />}
          title="No deleted projects"
          description="Projects you delete land here with their links, and stay until you restore them."
        />
      </Card>
    );
  }

  if (projects.length === 0) {
    return <NoMatches onClearSearch={onClearSearch} term={search} />;
  }

  return (
    <Card className="divide-y divide-border-subtle">
      {projects.map((project) => (
        <RestoreRow
          key={project._id}
          title={project.title}
          deletedAt={project.deletedAt}
          error={rowErrors[project._id]}
          errorAction={
            <Link
              to="/app/projects"
              className="rounded-sm text-primary-600 hover:underline"
            >
              Rename the active project
            </Link>
          }
          restoring={restoringId === project._id}
          onRestore={() => onRestore(project._id)}
          meta={
            <span className="text-body-sm text-content-tertiary">
              Its links return with it
            </span>
          }
        />
      ))}
    </Card>
  );
}

function RestoreRow({
  title,
  meta,
  deletedAt,
  error,
  errorAction,
  restoring,
  onRestore,
}: {
  title: string;
  meta: React.ReactNode;
  deletedAt: string | null;
  error?: string;
  errorAction?: React.ReactNode;
  restoring: boolean;
  onRestore: () => void;
}) {
  return (
    <div className="flex flex-col gap-sm p-md md:flex-row md:items-center md:gap-md">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 break-all text-label-lg text-content-primary">
          {title}
        </p>
        <div className="mt-2xs flex flex-wrap items-center gap-xs">{meta}</div>

        {error && (
          <p role="alert" className="mt-xs text-body-sm text-danger">
            {error} {errorAction}
          </p>
        )}
      </div>

      <p className="text-body-sm text-content-tertiary md:w-36 md:text-right">
        {deletedAt ? `Deleted ${formatRelative(deletedAt)}` : 'Deleted'}
      </p>

      <Button
        variant="secondary"
        size="sm"
        loading={restoring}
        onClick={onRestore}
        aria-label={`Restore ${title}`}
        className="self-start md:self-auto"
      >
        <ArchiveRestore className="h-4 w-4" aria-hidden />
        Restore
      </Button>
    </div>
  );
}

function NoMatches({ onClearSearch, term }: { onClearSearch: () => void; term: string }) {
  return (
    <EmptyState
      icon={<SearchX className="h-8 w-8" aria-hidden />}
      title="No matching items"
      description={`Nothing in the Recycle Bin matches “${term}”.`}
      action={
        <Button variant="secondary" onClick={onClearSearch}>
          Clear search
        </Button>
      }
    />
  );
}
