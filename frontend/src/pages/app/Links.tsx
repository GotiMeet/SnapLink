import { useMemo, useState } from 'react';
import { Link2, Plus, SearchX } from 'lucide-react';

import { CreateLinkDrawer } from '@/components/links/CreateLinkDrawer';
import { LinkRow } from '@/components/links/LinkRow';
import { QrModal } from '@/components/links/QrModal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteLink } from '@/hooks/useDeleteLink';
import { useProjects } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import type { ShortUrl } from '@/types/models';
import { usePageMeta } from '@/hooks/usePageMeta';

type StatusFilter = 'all' | 'active' | 'inactive';
/**
 * The catalogue was the only one of the three list screens that could not be
 * reordered — Projects has a sort control and Analytics Overview has three —
 * so users reached for the analytics leaderboard to manage links, which is not
 * what it is for. 'recent' is the order the API already returns.
 */
type SortKey = 'recent' | 'visits' | 'created' | 'title';

/**
 * `w-full` and `min-w-0` are both load-bearing.
 *
 * A native select's intrinsic width is set by its longest option, and it does
 * not shrink below that by default. With a project titled "Client — Nordwind
 * Studios" the select claimed most of the filter row and squeezed the flex-1
 * search field down to a few pixels, overlapping its own label. Pinning the
 * select to its wrapper's width instead moves the sizing decision to the grid.
 */
const selectClass =
  'h-10 w-full min-w-0 rounded-md border border-border-subtle bg-surface-card px-sm text-body-md text-content-primary focus:outline-none focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20';

/** SCR-AUTH-05. */
export function LinksPage() {
  usePageMeta({ title: 'All Links', noindex: true });
  // One unfiltered request; project and status narrowing happen in memory.
  // There is no pagination anywhere in v1 (D22), and passing projectId to the
  // API instead would refetch on every filter change for no gain at this scale.
  const urlsQuery = useUrls();
  const projectsQuery = useProjects();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [creating, setCreating] = useState(false);
  const [qrFor, setQrFor] = useState<ShortUrl | null>(null);

  const { deleteLink } = useDeleteLink();

  const projectTitles = useMemo(() => {
    const titles = new Map<string, string>();
    for (const project of projectsQuery.data ?? [])
      titles.set(project._id, project.title);
    return titles;
  }, [projectsQuery.data]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = (urlsQuery.data ?? []).filter((link) => {
      if (projectFilter !== 'all' && link.project !== projectFilter) return false;
      if (statusFilter !== 'all' && link.status !== statusFilter) return false;
      if (!term) return true;
      return (
        link.title.toLowerCase().includes(term) ||
        link.shortCode.toLowerCase().includes(term)
      );
    });

    // Copy before sorting: the query cache's array is not ours to reorder.
    const rows = [...filtered];
    if (sort === 'visits') rows.sort((a, b) => b.clickCount - a.clickCount);
    else if (sort === 'created') {
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === 'title') {
      rows.sort((a, b) => a.title.localeCompare(b.title));
    }
    return rows;
  }, [urlsQuery.data, search, projectFilter, statusFilter, sort]);

  const total = urlsQuery.data?.length ?? 0;
  /*
   * GET /urls?deleted=false returns active *and* scheduled links, so the list
   * length is not the active count. The chip used to render it as "8 active"
   * on a workspace with six active links and two scheduled ones — a wrong
   * number beside the page title, and one the Dashboard contradicted.
   */
  const activeCount = useMemo(
    () => (urlsQuery.data ?? []).filter((link) => link.status === 'active').length,
    [urlsQuery.data]
  );
  const scheduledCount = total - activeCount;
  const filtered =
    search.trim() !== '' || projectFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setProjectFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <h1 className="text-heading-xl">All Links</h1>
          {urlsQuery.isSuccess && (
            <span className="rounded-full bg-surface-subtle px-xs py-3xs text-label-md text-content-secondary">
              {filtered
                ? `${visible.length} of ${total}`
                : scheduledCount > 0
                  ? `${activeCount} active · ${scheduledCount} scheduled`
                  : `${activeCount} active`}
            </span>
          )}
        </div>

        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Create short link
        </Button>
      </header>

      {urlsQuery.isError && (
        <Alert
          tone="danger"
          title="Failed to load links"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => urlsQuery.refetch()}
              loading={urlsQuery.isFetching}
            >
              Try again
            </Button>
          }
        >
          <p>Please try refreshing.</p>
        </Alert>
      )}

      {urlsQuery.isPending && (
        <>
          <Skeleton className="h-10 w-full max-w-sm" />
          <Card className="divide-y divide-border-subtle">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="p-md">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </Card>
        </>
      )}

      {urlsQuery.isSuccess && total === 0 && (
        <EmptyState
          icon={<Link2 className="h-8 w-8" aria-hidden />}
          title="No short links created yet"
          description="Shorten long URLs, customise your links, and track every visit."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Shorten your first link
            </Button>
          }
        />
      )}

      {urlsQuery.isSuccess && total > 0 && (
        <>
          {/*
            A grid rather than a wrapping flex row: the three controls then have
            widths the layout decides, instead of widths their own content
            decides. See `selectClass` for what that was costing.
          */}
          <div className="grid items-end gap-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_minmax(0,9rem)_minmax(0,11rem)] lg:gap-md">
            <div className="min-w-0">
              <Input
                label="Search links"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or short code"
              />
            </div>

            <label className="flex min-w-0 flex-col gap-2xs">
              <span className="text-label-lg text-content-primary">Project</span>
              <select
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
                className={selectClass}
              >
                <option value="all">All projects</option>
                {projectsQuery.data?.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-2xs">
              <span className="text-label-lg text-content-primary">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className={selectClass}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Scheduled</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-2xs">
              <span className="text-label-lg text-content-primary">Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className={selectClass}
              >
                <option value="recent">Recently updated</option>
                <option value="visits">Most visits</option>
                <option value="created">Newest created</option>
                <option value="title">Alphabetical</option>
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            /* Carded: this replaces the list, not the page. */
            <Card className="p-lg">
              <EmptyState
                icon={<SearchX className="h-8 w-8" aria-hidden />}
                title="No matching links found"
                description="Try a different search term, or clear the filters to see everything."
                action={
                  <Button variant="secondary" onClick={resetFilters}>
                    Reset filters
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {/* A screen reader cannot see the list shrink as filters change. */}
              <p aria-live="polite" className="sr-only">
                {visible.length} of {total} links shown
              </p>

              <Card className="divide-y divide-border-subtle">
                {/*
                  Names the two columns that carried none. The relative time in
                  particular was read as last visit — a different and more
                  interesting number — when it is when the link was last edited.
                  Hidden below md, where the rows are stacked cards and the
                  figures are labelled inline.
                */}
                <div
                  aria-hidden
                  className="hidden items-center gap-md px-md py-xs text-label-md uppercase tracking-wide text-content-tertiary md:flex"
                >
                  <span className="min-w-0 flex-1">Link</span>
                  <span className="w-56 shrink-0">Status</span>
                  <span className="w-20 shrink-0 text-right">Visits</span>
                  <span className="hidden w-28 shrink-0 text-right lg:block">Updated</span>
                  <span className="w-[7.5rem] shrink-0" />
                </div>

                {visible.map((link) => (
                  <LinkRow
                    key={link._id}
                    link={link}
                    projectTitle={projectTitles.get(link.project)}
                    onShowQr={() => setQrFor(link)}
                    onDelete={() => deleteLink(link._id)}
                  />
                ))}
              </Card>
            </>
          )}
        </>
      )}

      <CreateLinkDrawer open={creating} onOpenChange={setCreating} />
      <QrModal link={qrFor} onOpenChange={(open) => !open && setQrFor(null)} />
    </div>
  );
}
