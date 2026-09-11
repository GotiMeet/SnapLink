import { Suspense, lazy, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CalendarRange,
  MousePointerClick,
  PencilLine,
  QrCode,
} from 'lucide-react';

import { BreakdownList } from '@/components/analytics/BreakdownList';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { StatCard } from '@/components/analytics/StatCard';
/*
 * Recharts is ~390kB minified — nearly as large as the rest of the app. Loading
 * it lazily keeps it out of the initial bundle every other screen pays for, and
 * it is only ever needed once someone opens this one chart. The fallback is the
 * chart's own height, so nothing shifts when it arrives.
 */
const TimelineChart = lazy(() =>
  import('@/components/analytics/TimelineChart').then((module) => ({
    default: module.TimelineChart,
  }))
);
import { CopyButton } from '@/components/links/CopyButton';
import { LinkStatusBadge, LinkVisibilityBadge } from '@/components/links/LinkBadges';
import { QrModal } from '@/components/links/QrModal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TabPanel, Tabs } from '@/components/ui/Tabs';
import { env } from '@/env';
import { useBreadcrumbTitle } from '@/hooks/useBreadcrumbTitle';
import { useLinkAnalytics } from '@/hooks/useAnalytics';
import { useUrl } from '@/hooks/useUrls';
import { ApiError } from '@/lib/api';
import { prettyBucket, prettyLanguage, zeroFillTimeline } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import {
  DEFAULT_RANGE_DAYS,
  formatDayLabel,
  presetRange,
  rangeLengthDays,
  type DateRange,
} from '@/lib/dates';
import { formatCount, formatDate } from '@/lib/format';
import type { AnalyticsReport, ShortUrl } from '@/types/models';
import { usePageMeta } from '@/hooks/usePageMeta';

const shortLinkHost = env.appUrl.replace(/^https?:\/\//, '');

type Tab = 'overview' | 'breakdowns';

/** SCR-AUTH-09B / 09C / 09D / 09E / 09F. */
export function LinkAnalyticsPage() {
  const { urlId } = useParams();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'breakdowns' ? 'breakdowns' : 'overview';

  const [range, setRange] = useState<DateRange>(() => presetRange(DEFAULT_RANGE_DAYS));

  const linkQuery = useUrl(urlId);
  const analyticsQuery = useLinkAnalytics(urlId, range);

  usePageMeta({
    title: linkQuery.data ? `${linkQuery.data.title} analytics` : 'Link analytics',
    noindex: true,
  });
  useBreadcrumbTitle(
    linkQuery.data?.title ?? (linkQuery.isError ? 'Not found' : undefined)
  );

  if (linkQuery.isPending) {
    return <AnalyticsSkeleton />;
  }

  if (linkQuery.isError) {
    const notFound =
      linkQuery.error instanceof ApiError && linkQuery.error.status === 404;

    return (
      <EmptyState
        icon={<BarChart3 className="h-8 w-8" aria-hidden />}
        as="h1"
        title={
          notFound ? 'Link not found or has been deleted' : 'Failed to load this link'
        }
        description={
          notFound
            ? 'A deleted link keeps its history, but you have to restore it before you can report on it here.'
            : 'Please try again in a moment.'
        }
        action={
          <Link to="/app/links">
            <Button>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to links
            </Button>
          </Link>
        }
      />
    );
  }

  const link = linkQuery.data;

  return (
    <div className="flex flex-col gap-lg">
      <LinkAnalyticsHeader link={link} />

      <DateRangePicker range={range} onChange={setRange} />

      <Tabs<Tab>
        label="Analytics sections"
        active={tab}
        onChange={(next) =>
          setParams(next === 'breakdowns' ? { tab: 'breakdowns' } : {}, { replace: true })
        }
        tabs={[
          { id: 'overview', label: 'Overview & timeline' },
          { id: 'breakdowns', label: 'Breakdowns' },
        ]}
      />

      <TabPanel id={tab}>
        <AnalyticsBody
          link={link}
          tab={tab}
          range={range}
          report={analyticsQuery.data}
          loading={analyticsQuery.isPending}
          refreshing={analyticsQuery.isFetching && !analyticsQuery.isPending}
          error={analyticsQuery.error}
          onResetRange={() => setRange(presetRange(DEFAULT_RANGE_DAYS))}
        />
      </TabPanel>
    </div>
  );
}

function LinkAnalyticsHeader({ link }: { link: ShortUrl }) {
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-start justify-between gap-md">
      <div className="min-w-0">
        <h1 className="break-words text-heading-xl">{link.title}</h1>
        <div className="mt-xs flex flex-wrap items-center gap-xs">
          <span className="font-mono text-mono-code text-primary-text">
            {shortLinkHost}/{link.shortCode}
          </span>
          <CopyButton value={`${env.appUrl}/${link.shortCode}`} label="short link" />
          <LinkStatusBadge link={link} />
          <LinkVisibilityBadge link={link} />
        </div>
      </div>

      <div className="flex flex-wrap gap-xs">
        <Button variant="secondary" onClick={() => setQrOpen(true)}>
          <QrCode className="h-4 w-4" aria-hidden />
          QR code
        </Button>
        <Link to={`/app/links/${link._id}`}>
          <Button variant="secondary">
            <PencilLine className="h-4 w-4" aria-hidden />
            Edit link
          </Button>
        </Link>
      </div>

      <QrModal link={qrOpen ? link : null} onOpenChange={setQrOpen} />
    </header>
  );
}

function AnalyticsBody({
  link,
  tab,
  range,
  report,
  loading,
  refreshing,
  error,
  onResetRange,
}: {
  link: ShortUrl;
  tab: Tab;
  range: DateRange;
  report: AnalyticsReport | undefined;
  loading: boolean;
  refreshing: boolean;
  error: unknown;
  onResetRange: () => void;
}) {
  const rangeDays = rangeLengthDays(range);

  const points = useMemo(
    () => (report ? zeroFillTimeline(report.timeline, range) : []),
    [report, range]
  );

  if (error) {
    return (
      <AnalyticsError error={error} rangeDays={rangeDays} onResetRange={onResetRange} />
    );
  }

  if (loading) return <AnalyticsSkeleton />;
  if (!report) return null;

  const { overview } = report;
  const noVisits = overview.totalVisits === 0;

  return (
    <div className={cn('flex flex-col gap-lg', refreshing && 'opacity-60')}>
      {refreshing && (
        <p role="status" className="sr-only">
          Loading analytics for the selected range
        </p>
      )}

      <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Total visits"
          value={formatCount(overview.totalVisits)}
          hint={`${rangeDays} day window`}
        />
        <StatCard
          icon={MousePointerClick}
          label="Web clicks"
          value={formatCount(overview.clicks)}
          hint={share(overview.clicks, overview.totalVisits)}
        />
        <StatCard
          icon={QrCode}
          label="QR scans"
          value={formatCount(overview.qrScans)}
          hint={share(overview.qrScans, overview.totalVisits)}
        />
        <StatCard
          icon={CalendarRange}
          label="Active days"
          value={`${formatCount(overview.daysWithVisits)} / ${rangeDays}`}
          hint={
            overview.firstVisitOn && overview.lastVisitOn
              ? `${formatDate(overview.firstVisitOn)} – ${formatDate(overview.lastVisitOn)}`
              : 'No visits in this window'
          }
        />
      </div>

      {noVisits ? (
        <Card className="p-lg">
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" aria-hidden />}
            title="No visits in this window"
            description="Nothing has reached this link between the selected dates. Share it, or widen the range to look further back."
            action={
              <div className="flex flex-wrap justify-center gap-xs">
                <Button variant="secondary" onClick={onResetRange}>
                  Reset to last {DEFAULT_RANGE_DAYS} days
                </Button>
                <Link to={`/app/links/${link._id}`}>
                  <Button>View link details</Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : tab === 'overview' ? (
        <>
          <Card className="p-md">
            <h2 className="text-heading-md">Daily visits</h2>
            <div className="mt-md">
              <Suspense fallback={<Skeleton className="h-[296px] w-full rounded-lg" />}>
                <TimelineChart points={points} rangeDays={rangeDays} />
              </Suspense>
            </div>
          </Card>

          <DailyTable points={points} />
        </>
      ) : (
        <Breakdowns report={report} />
      )}
    </div>
  );
}

const share = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}% of visits` : undefined;

/**
 * The chart's numbers in a form a screen reader can actually read, and the
 * chronological table SCR-AUTH-09B calls for.
 *
 * Days with no visits are omitted here even though they are infilled for the
 * chart: the chart needs them to keep its scale honest, a table of 300 zero
 * rows is just noise.
 */
function DailyTable({ points }: { points: ReturnType<typeof zeroFillTimeline> }) {
  const rows = points.filter((point) => point.totalVisits > 0).reverse();

  return (
    <Card className="overflow-hidden">
      <h2 className="border-b border-border-subtle px-md py-sm text-heading-md">
        Day by day
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-body-md">
          <caption className="sr-only">
            Visits per day in the selected window, most recent first
          </caption>
          <thead>
            <tr className="border-b border-border-subtle text-label-md uppercase text-content-tertiary">
              <th scope="col" className="px-md py-xs text-left">
                Date
              </th>
              <th scope="col" className="px-md py-xs text-right">
                Web clicks
              </th>
              <th scope="col" className="px-md py-xs text-right">
                QR scans
              </th>
              <th scope="col" className="px-md py-xs text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((point) => (
              <tr key={point.date}>
                <th
                  scope="row"
                  className="px-md py-xs text-left font-normal text-content-secondary"
                >
                  {formatDayLabel(point.date)}
                </th>
                <td className="px-md py-xs text-right text-content-secondary">
                  {formatCount(point.clicks)}
                </td>
                <td className="px-md py-xs text-right text-content-secondary">
                  {formatCount(point.qrScans)}
                </td>
                <td className="px-md py-xs text-right text-label-lg text-content-primary">
                  {formatCount(point.totalVisits)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Breakdowns({ report }: { report: AnalyticsReport }) {
  return (
    <div className="grid gap-md lg:grid-cols-2">
      <BreakdownList
        title="Referrers"
        items={report.referrers}
        formatName={prettyBucket}
        emptyLabel="No referrers recorded in this window."
      />
      <BreakdownList
        title="Devices"
        items={report.devices}
        formatName={prettyBucket}
        emptyLabel="No device data in this window."
      />
      <BreakdownList
        title="Browsers"
        items={report.browsers}
        formatName={prettyBucket}
        emptyLabel="No browser data in this window."
      />
      <BreakdownList
        title="Operating systems"
        items={report.operatingSystems}
        formatName={prettyBucket}
        emptyLabel="No operating system data in this window."
      />
      <BreakdownList
        title="Languages"
        items={report.languages}
        formatName={prettyLanguage}
        emptyLabel="No language data in this window."
      />

      <Card className="flex flex-col p-md">
        <h3 className="text-heading-md">Clicks vs QR scans</h3>
        <p className="mt-2xs text-body-sm text-content-secondary">
          A visit counts as a QR scan only when it arrives through the code&apos;s own
          address.
        </p>
        <dl className="mt-sm flex flex-col gap-sm">
          <SplitRow
            label="Web clicks"
            value={report.overview.clicks}
            total={report.overview.totalVisits}
            colour="bg-primary-600"
          />
          <SplitRow
            label="QR scans"
            value={report.overview.qrScans}
            total={report.overview.totalVisits}
            colour="bg-success"
          />
        </dl>
      </Card>
    </div>
  );
}

function SplitRow({
  label,
  value,
  total,
  colour,
}: {
  label: string;
  value: number;
  total: number;
  colour: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3xs">
      <div className="flex items-baseline gap-xs">
        <dt className="flex-1 text-body-md text-content-primary">{label}</dt>
        <dd className="text-body-md text-content-secondary">{formatCount(value)}</dd>
        <dd className="w-10 text-right text-body-sm text-content-tertiary">{percent}%</dd>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle"
        aria-hidden
      >
        <div
          className={cn('h-full rounded-full', colour)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * SCR-AUTH-09F.
 *
 * The 400 for an oversized or inverted window is the one error with a fix the
 * user can apply from here, so it gets the recovery presets. Everything else
 * states what happened and offers a retry path.
 */
function AnalyticsError({
  error,
  rangeDays,
  onResetRange,
}: {
  error: unknown;
  rangeDays: number;
  onResetRange: () => void;
}) {
  const apiError = error instanceof ApiError ? error : null;
  const isRangeError = apiError?.status === 400;

  return (
    <Card className="p-lg">
      <div className="flex flex-col gap-md">
        <Alert
          tone="danger"
          title={
            isRangeError ? 'That date range is not allowed' : 'Unable to load analytics'
          }
        >
          <p>
            {apiError?.message ??
              'Unable to reach SnapLink. Check your connection and try again.'}
          </p>
          {isRangeError && (
            <p className="text-content-secondary">
              The selected window is {rangeDays} days. Reports are aggregated from UTC
              midnight and capped at 366 days per request.
            </p>
          )}
        </Alert>

        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
          {['Total visits', 'Web clicks', 'QR scans', 'Active days'].map((label) => (
            <Card key={label} className="p-md">
              <p className="text-body-sm text-content-secondary">{label}</p>
              <p className="text-heading-xl text-content-tertiary">—</p>
              <p className="mt-3xs text-body-sm text-content-tertiary">
                Data unavailable for this range
              </p>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button onClick={onResetRange}>Reset to last {DEFAULT_RANGE_DAYS} days</Button>
        </div>
      </div>
    </Card>
  );
}

/** SCR-AUTH-09E. Heights match the real elements so nothing shifts on arrival. */
function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-lg">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-8 w-full max-w-xl rounded-full" />

      <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[92px] w-full rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-80 w-full rounded-lg" />

      <p role="status" className="text-body-sm text-content-tertiary">
        Fetching analytics…
      </p>
    </div>
  );
}
