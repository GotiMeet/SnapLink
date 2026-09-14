/**
 * Analytics helpers that are not components.
 *
 * Kept out of the chart and list files so those export components only, which
 * is what Vite's fast refresh needs to work on them.
 */

import type { DateRange } from './dates';
import type { TimelinePoint } from '@/types/models';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fills every day in the window that the API omitted.
 *
 * `buildTimeline` maps only the days that have a document, so a link visited on
 * three days of a month arrives as three points. Plotted straight, those points
 * sit side by side and the chart reads as continuous daily traffic — it
 * misrepresents the trend rather than merely simplifying it. Infilling is the
 * frontend's job in v1 (D23, roadmap H2).
 *
 * Everything is computed in UTC because the API aggregates on UTC midnight.
 */
export function zeroFillTimeline(
  timeline: TimelinePoint[],
  { from, to }: DateRange
): TimelinePoint[] {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return [];

  const byDay = new Map<string, TimelinePoint>();
  for (const point of timeline) {
    byDay.set(new Date(point.date).toISOString().slice(0, 10), point);
  }

  const filled: TimelinePoint[] = [];
  for (let time = start; time <= end; time += DAY_MS) {
    const day = new Date(time).toISOString().slice(0, 10);
    const existing = byDay.get(day);
    filled.push(
      existing
        ? { ...existing, date: day }
        : { date: day, clicks: 0, qrScans: 0, totalVisits: 0 }
    );
  }

  return filled;
}

/** Buckets are stored lowercase; these are the display names for the known ones. */
const LABELS: Record<string, string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  safari: 'Safari',
  opera: 'Opera',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  android: 'Android',
  ios: 'iOS',
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  direct: 'Direct / none',
  unknown: 'Unknown',
};

export const prettyBucket = (name: string): string => LABELS[name] ?? name;

/**
 * Turns a primary language tag into a readable name where the browser can, and
 * leaves it alone where it cannot. `Intl.DisplayNames` is unavailable in some
 * environments, so the tag itself is always an acceptable answer.
 */
export function prettyLanguage(tag: string): string {
  if (tag === 'unknown') return 'Unknown';
  try {
    const display = new Intl.DisplayNames(undefined, { type: 'language' });
    return display.of(tag) ?? tag;
  } catch {
    return tag;
  }
}
