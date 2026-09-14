import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCount } from '@/lib/format';
import { formatDayLabel } from '@/lib/dates';
import type { TimelinePoint } from '@/types/models';

/** Section 7 fixes these two: web clicks brand blue, QR scans success green. */
const CLICKS_COLOUR = '#0F52FF';
const SCANS_COLOUR = '#00C389';

interface TooltipPayloadEntry {
  payload: TimelinePoint;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-md border border-border-subtle bg-surface-card p-sm shadow-md">
      <p className="text-label-md text-content-primary">{formatDayLabel(point.date)}</p>
      <dl className="mt-2xs flex flex-col gap-3xs text-body-sm">
        <div className="flex items-center gap-xs">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: CLICKS_COLOUR }}
          />
          <dt className="text-content-secondary">Web clicks</dt>
          <dd className="ml-auto text-content-primary">{formatCount(point.clicks)}</dd>
        </div>
        <div className="flex items-center gap-xs">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: SCANS_COLOUR }}
          />
          <dt className="text-content-secondary">QR scans</dt>
          <dd className="ml-auto text-content-primary">{formatCount(point.qrScans)}</dd>
        </div>
        <div className="mt-3xs flex items-center gap-xs border-t border-border-subtle pt-3xs">
          <dt className="text-content-secondary">Total</dt>
          <dd className="ml-auto text-label-md text-content-primary">
            {formatCount(point.totalVisits)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Dual-series stacked daily timeline.
 *
 * Areas rather than bars because the window can be 366 days wide, where bars
 * collapse to slivers. Stacked so the upper edge is total visits while the
 * split between the two stays readable.
 *
 * The chart itself is invisible to a screen reader; the daily table beside it
 * carries the same numbers, and the summary below gives the shape in words.
 */
export function TimelineChart({
  points,
  rangeDays,
}: {
  points: TimelinePoint[];
  rangeDays: number;
}) {
  // A tick per day is unreadable past a couple of weeks, so thin them out.
  const tickInterval = useMemo(
    () => Math.max(0, Math.ceil(points.length / 8) - 1),
    [points.length]
  );

  const totals = useMemo(
    () =>
      points.reduce(
        (sum, point) => ({
          clicks: sum.clicks + point.clicks,
          qrScans: sum.qrScans + point.qrScans,
        }),
        { clicks: 0, qrScans: 0 }
      ),
    [points]
  );

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center gap-md">
        <Legend colour={CLICKS_COLOUR} label="Web clicks" />
        <Legend colour={SCANS_COLOUR} label="QR scans" />
      </div>

      <div
        className="h-64 w-full"
        role="img"
        aria-label={`Daily visits over ${rangeDays} days: ${formatCount(totals.clicks)} web clicks and ${formatCount(totals.qrScans)} QR scans. The table below lists each day.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CLICKS_COLOUR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CLICKS_COLOUR} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="scansFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SCANS_COLOUR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SCANS_COLOUR} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            {/* CSS custom properties resolve inside SVG, so the grid and axes
                re-theme with the rest of the app without a JS theme listener. */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgb(var(--border-subtle))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayLabel}
              interval={tickInterval}
              tickLine={false}
              axisLine={{ stroke: 'rgb(var(--border-subtle))' }}
              tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 12 }}
              minTickGap={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: 'rgb(var(--text-tertiary))', fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: CLICKS_COLOUR }} />

            <Area
              type="linear"
              dataKey="clicks"
              name="Web clicks"
              stackId="visits"
              stroke={CLICKS_COLOUR}
              strokeWidth={2}
              fill="url(#clicksFill)"
              isAnimationActive={false}
            />
            <Area
              type="linear"
              dataKey="qrScans"
              name="QR scans"
              stackId="visits"
              stroke={SCANS_COLOUR}
              strokeWidth={2}
              fill="url(#scansFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="flex items-center gap-2xs text-body-sm text-content-secondary">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: colour }}
      />
      {label}
    </span>
  );
}
