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
