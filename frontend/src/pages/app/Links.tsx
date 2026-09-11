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

type StatusFilter = 'all' | 'active' | 'inactive';

const selectClass =
  'h-10 rounded-md border border-border-subtle bg-surface-card px-sm text-body-md text-content-primary focus:outline-none focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20';

/** SCR-AUTH-05. */
export function LinksPage() {
  // One unfiltered request; project and status narrowing happen in memory.
  // There is no pagination anywhere in v1 (D22), and passing projectId to the
  // API instead would refetch on every filter change for no gain at this scale.
  const urlsQuery = useUrls();
  const projectsQuery = useProjects();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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

    return (urlsQuery.data ?? []).filter((link) => {
      if (projectFilter !== 'all' && link.project !== projectFilter) return false;
      if (statusFilter !== 'all' && link.status !== statusFilter) return false;
      if (!term) return true;
      return (
        link.title.toLowerCase().includes(term) ||
        link.shortCode.toLowerCase().includes(term)
      );
    });
  }, [urlsQuery.data, search, projectFilter, statusFilter]);

  const total = urlsQuery.data?.length ?? 0;
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
              {filtered ? `${visible.length} of ${total}` : `${total} active`}
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
          <div className="flex flex-wrap items-end gap-md">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <Input
                label="Search links"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or short code"
              />
            </div>

            <label className="flex flex-col gap-2xs">
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

            <label className="flex flex-col gap-2xs">
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
          </div>

          {visible.length === 0 ? (
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
          ) : (
            <>
              {/* A screen reader cannot see the list shrink as filters change. */}
              <p aria-live="polite" className="sr-only">
                {visible.length} of {total} links shown
              </p>

              <Card className="divide-y divide-border-subtle">
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
