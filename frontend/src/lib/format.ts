/**
 * Display formatting. No date library — PROJECT_MASTER.md section 5 rules one
 * out, and the three things the UI actually needs are short enough to own.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `1,204`. Raw counts, never described as unique or verified visits. */
export const formatCount = (value: number): string => value.toLocaleString();

/** `12 Sep 2026`. */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/**
 * `just now`, `5 minutes ago`, `3 days ago`, then an absolute date.
 *
 * Switching to a date past a week keeps the phrasing honest: "47 days ago" is
 * harder to place than the date itself.
 */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const elapsed = Date.now() - then;

  // A clock skew between client and server can put a timestamp slightly ahead.
  if (elapsed < MINUTE) return 'just now';

  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(elapsed / DAY);
  if (days <= 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return formatDate(iso);
}
