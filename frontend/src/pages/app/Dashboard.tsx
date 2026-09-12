import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Folder, Link2, Plus, QrCode } from 'lucide-react';

import { StatCard } from '@/components/analytics/StatCard';
import { WelcomeOnboarding } from '@/components/dashboard/WelcomeOnboarding';
import { CreateLinkDrawer } from '@/components/links/CreateLinkDrawer';
import { LinkRow } from '@/components/links/LinkRow';
import { QrModal } from '@/components/links/QrModal';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteLink } from '@/hooks/useDeleteLink';
import { useProjects } from '@/hooks/useProjects';
import { useUrls } from '@/hooks/useUrls';
import { formatCount, formatRelative } from '@/lib/format';
import type { Project, ShortUrl } from '@/types/models';
import { usePageMeta } from '@/hooks/usePageMeta';

const RECENT_LINK_COUNT = 5;
const SHELF_PROJECT_COUNT = 3;

/**
 * Every figure here is reduced from the two lists the app already loads. There
 * is no workspace analytics endpoint — PROJECT_MASTER.md section 16 accepts the
 * client-side sum for v1 and tracks the real one as roadmap H1 — so nothing on
 * this screen costs a request the rest of the app was not making anyway.
 */
function deriveMetrics(links: ShortUrl[]) {
  let active = 0;
  let scheduled = 0;
  let totalVisits = 0;
  let qrScans = 0;

  for (const link of links) {
    if (link.status === 'active') active += 1;
    else if (link.status === 'inactive') scheduled += 1;
    totalVisits += link.clickCount;
    qrScans += link.qrScans;
  }

  return {
    active,
    scheduled,
    totalVisits,
    qrScans,
    // A share of nothing is not zero percent, it is undefined. Rendering 0%
    // would read as "no scans" when the truth is "no visits at all yet".
    qrShare: totalVisits > 0 ? Math.round((qrScans / totalVisits) * 100) : null,
  };
}

function linkCountsByProject(links: ShortUrl[]) {
  const counts = new Map<string, number>();
  for (const link of links) {
    counts.set(link.project, (counts.get(link.project) ?? 0) + 1);
  }
  return counts;
}

/** SCR-AUTH-01. */
export function DashboardPage() {
  usePageMeta({ title: 'Dashboard', noindex: true });
  const { user } = useAuth();
  const navigate = useNavigate();

  const urlsQuery = useUrls();
  const projectsQuery = useProjects();

  const [quickUrl, setQuickUrl] = useState('');
  const [drawerUrl, setDrawerUrl] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [qrFor, setQrFor] = useState<ShortUrl | null>(null);

  const { deleteLink } = useDeleteLink();

  const links = useMemo(() => urlsQuery.data ?? [], [urlsQuery.data]);
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  const metrics = useMemo(() => deriveMetrics(links), [links]);
  const counts = useMemo(() => linkCountsByProject(links), [links]);
  const lastVisits = useMemo(() => lastVisitByProject(links), [links]);

  const projectTitles = useMemo(() => {
    const titles = new Map<string, string>();
    for (const project of projects) titles.set(project._id, project.title);
    return titles;
  }, [projects]);

  // Both lists arrive sorted updatedAt desc from the API, so "recent" is the
  // head of each rather than a second sort.
  const recentLinks = links.slice(0, RECENT_LINK_COUNT);
  const shelfProjects = projects.slice(0, SHELF_PROJECT_COUNT);

  const loading = urlsQuery.isPending || projectsQuery.isPending;
  const failed = urlsQuery.isError || projectsQuery.isError;
  const isEmptyWorkspace =
    urlsQuery.isSuccess &&
    projectsQuery.isSuccess &&
    links.length === 0 &&
    projects.length === 0;

  const openDrawerWith = (url: string) => {
    setDrawerUrl(url);
    setCreatingLink(true);
  };

  /**
   * The quick field seeds the drawer rather than creating a link outright.
   * POST /urls requires a project and a title as well as a destination, so a
   * one-click shorten is not something this API can do — offering one would be
   * a button that always fails.
   */
  const quickStart = (event: FormEvent) => {
    event.preventDefault();
    openDrawerWith(quickUrl.trim());
    setQuickUrl('');
  };

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-heading-xl">Dashboard</h1>

        <div className="flex flex-wrap gap-xs">
          <Button variant="secondary" onClick={() => setCreatingProject(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New project
          </Button>
          <Button onClick={() => openDrawerWith('')}>
            <Plus className="h-4 w-4" aria-hidden />
            New link
          </Button>
        </div>
      </header>

      {failed && (
        <Alert
          tone="danger"
          title="Unable to refresh dashboard metrics"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                urlsQuery.refetch();
                projectsQuery.refetch();
              }}
              loading={urlsQuery.isFetching || projectsQuery.isFetching}
            >
              Retry
            </Button>
          }
        >
          <p>Please try again in a moment.</p>
        </Alert>
      )}

      {isEmptyWorkspace ? (
        <WelcomeOnboarding
          fullName={user?.fullName ?? ''}
          onCreateProject={() => setCreatingProject(true)}
        />
      ) : (
        <>
          <form className="flex flex-col gap-2xs" onSubmit={quickStart}>
            {/*
              The hint sits under the whole row rather than inside the field, so
              the button aligns with the input instead of being pushed down by
              the field's own helper text.
            */}
            <div className="flex flex-wrap items-end gap-xs">
              <div className="min-w-0 flex-1">
                <Input
                  label="Shorten a link"
                  type="url"
                  name="quickUrl"
                  value={quickUrl}
                  onChange={(event) => setQuickUrl(event.target.value)}
                  placeholder="https://example.com/a-very-long-address"
                  aria-describedby="quick-url-hint"
                />
              </div>
              <Button type="submit" disabled={!quickUrl.trim()}>
                Shorten
              </Button>
            </div>
            <p id="quick-url-hint" className="text-body-sm text-content-tertiary">
              Opens the link form with this destination filled in.
            </p>
          </form>

          <section aria-labelledby="metrics-heading">
            <h2 id="metrics-heading" className="sr-only">
              Workspace metrics
            </h2>

            <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Link2}
                label="Active links"
                value={formatCount(metrics.active)}
                loading={loading}
                hint={
                  metrics.scheduled > 0
                    ? `${formatCount(metrics.scheduled)} scheduled to go live`
                    : undefined
                }
              />
              <StatCard
                icon={Folder}
                label="Projects"
                value={formatCount(projects.length)}
                loading={loading}
              />
              <StatCard
                icon={BarChart3}
                label="Total visits"
                value={formatCount(metrics.totalVisits)}
                loading={loading}
                hint="Clicks and QR scans, all time"
              />
              <StatCard
                icon={QrCode}
                label="QR scan share"
                value={metrics.qrShare === null ? '—' : `${metrics.qrShare}%`}
                loading={loading}
                hint={
                  metrics.qrShare === null
                    ? 'No visits recorded yet'
                    : `${formatCount(metrics.qrScans)} of ${formatCount(metrics.totalVisits)} visits`
                }
              />
            </div>
          </section>

          <section aria-labelledby="recent-heading" className="flex flex-col gap-sm">
            <div className="flex items-center justify-between gap-md">
              <h2 id="recent-heading" className="text-heading-md">
                Recent links
              </h2>
              <Link
                to="/app/links"
                className="rounded-sm text-body-md text-primary-text hover:underline"
              >
                View all links
              </Link>
            </div>

            {loading && (
              <Card className="divide-y divide-border-subtle">
                {Array.from({ length: RECENT_LINK_COUNT }, (_, index) => (
                  <div key={index} className="p-md">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </Card>
            )}

            {!loading && recentLinks.length === 0 && (
              <Card className="p-lg">
                <EmptyState
                  icon={<Link2 className="h-8 w-8" aria-hidden />}
                  title="No short links yet"
                  description="Shorten your first URL to start capturing visits."
                  action={
                    <Button onClick={() => openDrawerWith('')}>
                      <Plus className="h-4 w-4" aria-hidden />
                      Create short link
                    </Button>
                  }
                />
              </Card>
            )}

            {!loading && recentLinks.length > 0 && (
              <Card className="divide-y divide-border-subtle">
                {recentLinks.map((link) => (
                  <LinkRow
                    key={link._id}
                    link={link}
                    projectTitle={projectTitles.get(link.project)}
                    onShowQr={() => setQrFor(link)}
                    onDelete={() => deleteLink(link._id)}
                  />
                ))}
              </Card>
            )}
          </section>

          <section aria-labelledby="projects-heading" className="flex flex-col gap-sm">
            <div className="flex items-center justify-between gap-md">
              <h2 id="projects-heading" className="text-heading-md">
                Projects
              </h2>
              <Link
                to="/app/projects"
                className="rounded-sm text-body-md text-primary-text hover:underline"
              >
                View all projects
              </Link>
            </div>

            {loading && (
              <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: SHELF_PROJECT_COUNT }, (_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!loading && shelfProjects.length === 0 && (
              <Card className="p-lg">
                <EmptyState
                  icon={<Folder className="h-8 w-8" aria-hidden />}
                  title="No projects yet"
                  description="Every link lives in a project. Create one to get started."
                  action={
                    <Button onClick={() => setCreatingProject(true)}>
                      <Plus className="h-4 w-4" aria-hidden />
                      Create project
                    </Button>
                  }
                />
              </Card>
            )}

            {!loading && shelfProjects.length > 0 && (
              <ul className="grid list-none gap-md sm:grid-cols-2 xl:grid-cols-3">
                {shelfProjects.map((project) => (
                  <li key={project._id}>
                    <ShelfCard
                      project={project}
                      linkCount={counts.get(project._id) ?? 0}
                      lastVisit={lastVisits.get(project._id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <CreateLinkDrawer
        open={creatingLink}
        onOpenChange={setCreatingLink}
        initialUrl={drawerUrl}
      />

      <CreateProjectModal
        open={creatingProject}
        onOpenChange={setCreatingProject}
        onCreated={(projectId) => navigate(`/app/projects/${projectId}`)}
      />

      <QrModal link={qrFor} onOpenChange={(open) => !open && setQrFor(null)} />
    </div>
  );
}

/**
 * `project.updatedAt` only moves when the title is renamed — the model has three
 * fields and none of them records traffic — so labelling it "Active" told the
 * user something false on the one screen whose job is reporting activity. Real
 * recency is one reduce over the link list this page already holds.
 */
function lastVisitByProject(links: ShortUrl[]) {
  const latest = new Map<string, string>();
  for (const link of links) {
    if (!link.lastAccessedAt) continue;
    const current = latest.get(link.project);
    if (!current || link.lastAccessedAt > current) {
      latest.set(link.project, link.lastAccessedAt);
    }
  }
  return latest;
}

function ShelfCard({
  project,
  linkCount,
  lastVisit,
}: {
  project: Project;
  linkCount: number;
  lastVisit?: string;
}) {
  return (
    <Link
      to={`/app/projects/${project._id}`}
      className="flex h-full items-start gap-sm rounded-lg border border-border-subtle bg-surface-card p-md shadow-xs transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-text"
      >
        <Folder className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-label-lg text-content-primary">
          {project.title}
        </span>
        <span className="mt-3xs block text-body-sm text-content-secondary">
          {formatCount(linkCount)} {linkCount === 1 ? 'link' : 'links'}
        </span>
        <span className="block text-body-sm text-content-tertiary">
          {lastVisit ? `Last visit ${formatRelative(lastVisit)}` : 'No visits yet'}
        </span>
      </span>
    </Link>
  );
}
