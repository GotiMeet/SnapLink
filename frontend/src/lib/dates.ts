/**
 * Date helpers. No date library — PROJECT_MASTER.md section 5 rules one out.
 */

/**
 * ISO 8601 instant to the value a `datetime-local` input expects.
 *
 * The input has no timezone, so it must be fed local wall-clock time. Building
 * the string from the local getters rather than slicing `toISOString()` is the
 * whole point: slicing the ISO string shows UTC, which is simply the wrong time
 * for anyone not on UTC and silently shifts a schedule by their offset.
 */
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * `datetime-local` value to the ISO instant the API validates.
 * Returns null for an empty input, which is how a schedule is cleared.
 */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** `datetime-local` min attribute: now, so the picker discourages past dates. */
export const nowInputValue = (): string => toLocalInputValue(new Date().toISOString());

/**
 * Analytics window helpers.
 *
 * The API aggregates on UTC midnight and answers `from`/`to` as UTC-midnight
 * instants, so every calculation here is in UTC. Using local dates would put a
 * user west of Greenwich a day out on the boundary of their own window.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Backend `DEFAULT_REPORT_DAYS`. */
export const DEFAULT_RANGE_DAYS = 30;
/** Backend `MAX_REPORT_DAYS`. A longer window is refused with a 400. */
export const MAX_RANGE_DAYS = 366;

export interface DateRange {
  /** YYYY-MM-DD, inclusive. */
  from: string;
  /** YYYY-MM-DD, inclusive. */
  to: string;
}

/** UTC calendar day of an instant, as the API's `from`/`to` expect it. */
export const toDateParam = (value: Date | string): string =>
  new Date(value).toISOString().slice(0, 10);

/** The window ending today and covering `days` days, today included. */
export function presetRange(days: number): DateRange {
  const end = Date.now();
  return {
    from: toDateParam(new Date(end - (days - 1) * DAY_MS)),
    to: toDateParam(new Date(end)),
  };
}

/** Inclusive length of a window in days; 0 when either bound is unreadable. */
export function rangeLengthDays({ from, to }: DateRange): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / DAY_MS) + 1;
}

/** Short axis label, e.g. `12 Sep`. */
export const formatDayLabel = (isoDay: string): string =>
  new Date(`${isoDay.slice(0, 10)}T00:00:00Z`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
