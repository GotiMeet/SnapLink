import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Folder, Link2, Plus, Sigma, Trophy } from 'lucide-react';

import { StatCard } from '@/components/analytics/StatCard';
import { CopyButton } from '@/components/links/CopyButton';
import { CreateLinkDrawer } from '@/components/links/CreateLinkDrawer';
import { LinkStatusBadge, LinkVisibilityBadge } from '@/components/links/LinkBadges';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { env } from '@/env';
import { useUrls } from '@/hooks/useUrls';
import { cn } from '@/lib/cn';
import { formatCount, formatRelative } from '@/lib/format';
import type { ShortUrl } from '@/types/models';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

type SortKey = 'visits' | 'recent' | 'created';

const PODIUM_ACCENTS = ['text-warning', 'text-content-tertiary', 'text-[#D97706]'];
const PODIUM_LABELS = ['Most visited', 'Second', 'Third'];

/**
 * SCR-AUTH-09A / 09G.
 *
 * Everything here comes from one GET /urls. There is no workspace analytics
 * endpoint — section 16 accepts the client-side reduction for v1 and tracks the
 * real one as roadmap H1 — so this screen reports lifetime totals, not a
 * windowed report. The date range belongs to the per-link screen, which is the
 * only place the analytics API can answer for.
 *
 * No trend indicators anywhere: `resolveRange` answers exactly one window per
 * request, so there is no previous period to compare against (D5).
 */
export function AnalyticsOverviewPage() {
  const urlsQuery = useUrls();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('visits');
  const [creating, setCreating] = useState(false);

  const links = useMemo(() => urlsQuery.data ?? [], [urlsQuery.data]);

  const totals = useMemo(() => {
    let visits = 0;
    let active = 0;
    for (const link of links) {
      visits += link.clickCount;
      if (link.status === 'active') active += 1;
    }
    return {
      visits,
      active,
      // Averaged over every link the workspace has, not only the ones with
      // traffic — an average that silently drops the zeroes flatters itself.
      average: links.length > 0 ? Math.round(visits / links.length) : 0,
    };
  }, [links]);

  const ranked = useMemo(
    () => [...links].sort((a, b) => b.clickCount - a.clickCount),
    [links]
  );
  const topLink = ranked[0];
  const podium = ranked.filter((link) => link.clickCount > 0).slice(0, 3);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? links.filter(
          (link) =>
            link.title.toLowerCase().includes(term) ||
            link.shortCode.toLowerCase().includes(term)
        )
      : links;

    const rows = [...filtered];
    if (sort === 'visits') rows.sort((a, b) => b.clickCount - a.clickCount);
    else if (sort === 'created') {
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    // 'recent' is the order the API already returns (updatedAt desc).
    return rows;
  }, [links, search, sort]);

  const maxVisits = ranked[0]?.clickCount ?? 0;

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-wrap items-start justify-between gap-md">
        <div className="min-w-0">
          <h1 className="text-heading-xl">Analytics</h1>
          <p className="mt-2xs text-body-md text-content-secondary">
            Lifetime totals across every link. Open a link for its day-by-day report.
          </p>
        </div>

        <div className="flex flex-wrap gap-xs">
          <Link to="/app/projects">
            <Button variant="ghost">
              <Folder className="h-4 w-4" aria-hidden />
              View projects
            </Button>
          </Link>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create link
          </Button>
        </div>
      </header>

      {urlsQuery.isError && (
        <Alert
          tone="danger"
          title="Unable to load analytics"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => urlsQuery.refetch()}
              loading={urlsQuery.isFetching}
            >
              Retry
            </Button>
          }
        >
          <p>Please try again in a moment.</p>
        </Alert>
      )}

      {urlsQuery.isPending && (
        <>
          <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-[92px] w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </>
      )}

      {urlsQuery.isSuccess && links.length === 0 && (
        <Card className="p-lg sm:p-xl">
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" aria-hidden />}
            title="No analytics yet"
            description="Analytics are generated the moment someone visits a link you have shortened. Nothing to report until then."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Shorten your first link
              </Button>
            }
          />
          <p className="mt-lg text-center text-body-sm text-content-tertiary">
            SnapLink records no IP address, no raw user agent, and no per-visit row — only
            daily counts per link.
          </p>
        </Card>
      )}

      {urlsQuery.isSuccess && links.length > 0 && (
        <>
          <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={BarChart3}
              label="Total visits"
              value={formatCount(totals.visits)}
              hint="Clicks and QR scans, all time"
            />
            <StatCard
              icon={Link2}
              label="Active links"
              value={formatCount(totals.active)}
              hint={
                links.length !== totals.active
                  ? `${formatCount(links.length - totals.active)} scheduled`
                  : 'All resolving'
              }
            />
            <StatCard
              icon={Sigma}
              label="Average per link"
              value={formatCount(totals.average)}
              hint={`Across ${formatCount(links.length)} ${links.length === 1 ? 'link' : 'links'}`}
            />
            <TopLinkCard link={topLink} total={totals.visits} />
          </div>

          {podium.length > 0 && (
            <section aria-labelledby="podium-heading" className="flex flex-col gap-sm">
              <h2 id="podium-heading" className="text-heading-md">
                Top performers
              </h2>
              <ul className="grid list-none gap-md sm:grid-cols-2 xl:grid-cols-3">
                {podium.map((link, index) => (
                  <li key={link._id}>
                    <Link
                      to={`/app/links/${link._id}/analytics`}
                      className="flex h-full items-start gap-sm rounded-lg border border-border-subtle bg-surface-card p-md shadow-xs transition-colors hover:border-primary-600"
                    >
                      <Trophy
                        className={cn('mt-3xs h-5 w-5 shrink-0', PODIUM_ACCENTS[index])}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-body-sm text-content-tertiary">
                          {PODIUM_LABELS[index]}
                        </span>
                        <span className="block truncate text-label-lg text-content-primary">
                          {link.title}
                        </span>
                        <span className="mt-3xs block truncate font-mono text-mono-code text-primary-600">
                          {shortLinkHost}/{link.shortCode}
                        </span>
                        <span className="mt-2xs block text-body-md text-content-secondary">
                          {formatCount(link.clickCount)} visits
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="leaderboard-heading" className="flex flex-col gap-sm">
            <div className="flex flex-wrap items-end justify-between gap-md">
              <h2 id="leaderboard-heading" className="text-heading-md">
                All links
              </h2>

              <div className="flex flex-wrap items-end gap-md">
                <div className="min-w-0 sm:w-64">
                  <Input
                    label="Search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Title or short code"
                  />
                </div>
                <label className="flex flex-col gap-2xs">
                  <span className="text-label-lg text-content-primary">Sort by</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortKey)}
                    className="h-10 rounded-md border border-border-subtle bg-surface-card px-sm text-body-md text-content-primary focus:outline-none focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-600/20"
                  >
                    <option value="visits">Lifetime visits</option>
                    <option value="recent">Recent activity</option>
                    <option value="created">Newest created</option>
                  </select>
                </label>
              </div>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-8 w-8" aria-hidden />}
                title="No matching links found"
                description="Clear your search term to see every link."
                action={
                  <Button variant="secondary" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <Card className="divide-y divide-border-subtle">
                {visible.map((link) => (
                  <LeaderboardRow key={link._id} link={link} maxVisits={maxVisits} />
                ))}
              </Card>
            )}
          </section>
        </>
      )}

      <CreateLinkDrawer open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function TopLinkCard({ link, total }: { link: ShortUrl | undefined; total: number }) {
  if (!link || link.clickCount === 0) {
    return (
      <StatCard
        icon={Trophy}
        label="Top performing link"
        value="None yet"
        hint="No visits recorded"
      />
    );
  }

  const percent = total > 0 ? Math.round((link.clickCount / total) * 1000) / 10 : 0;

  return (
    <Link
      to={`/app/links/${link._id}/analytics`}
      className="rounded-lg transition-transform hover:-translate-y-0.5"
    >
      <StatCard
        icon={Trophy}
        label="Top performing link"
        value={
          <span className="block truncate font-mono text-heading-md text-primary-600">
            {shortLinkHost}/{link.shortCode}
          </span>
        }
        hint={`${formatCount(link.clickCount)} visits · ${percent}% of total`}
      />
    </Link>
  );
}

function LeaderboardRow({ link, maxVisits }: { link: ShortUrl; maxVisits: number }) {
  // Relative to the busiest link, so the meter compares links rather than
  // implying a target.
  const share = maxVisits > 0 ? Math.round((link.clickCount / maxVisits) * 100) : 0;

  return (
    <div className="flex flex-col gap-sm p-md md:flex-row md:items-center md:gap-md">
      <div className="min-w-0 flex-1">
        <Link
          to={`/app/links/${link._id}`}
          className="rounded-sm text-label-lg text-content-primary hover:text-primary-600"
        >
          <span className="line-clamp-1 break-all">{link.title}</span>
        </Link>
        <div className="mt-2xs flex flex-wrap items-center gap-xs">
          <span className="font-mono text-mono-code text-primary-600">
            {shortLinkHost}/{link.shortCode}
          </span>
          <CopyButton value={`${env.appUrl}/${link.shortCode}`} label="short link" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-xs md:w-44 md:shrink-0">
        <LinkStatusBadge link={link} />
        <LinkVisibilityBadge link={link} />
      </div>

      <div className="md:w-44 md:shrink-0">
        <p className="flex items-baseline gap-xs">
          <span className="text-label-lg text-content-primary">
            {formatCount(link.clickCount)}
          </span>
          <span className="text-body-sm text-content-tertiary">
            {formatCount(link.clicks)} web · {formatCount(link.qrScans)} QR
          </span>
        </p>
        <div
          className="mt-3xs h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-primary-600"
            style={{ width: `${share}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-xs md:w-auto">
        <p className="hidden w-28 text-right text-body-sm text-content-tertiary lg:block">
          {link.lastAccessedAt ? formatRelative(link.lastAccessedAt) : 'No visits'}
        </p>
        <Link
          to={`/app/links/${link._id}/analytics`}
          className="flex items-center gap-3xs rounded-md px-xs py-3xs text-body-md text-primary-600 hover:underline"
        >
          View analytics
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
