/**
 * Client mirrors of the link validation rules the API enforces.
 *
 * These exist to catch a mistake before a round trip, never to decide whether a
 * request is allowed. The server validates every submission regardless, and the
 * alias in particular is only truly claimed by POST /urls.
 *
 * Sources: `ALIAS_PATTERN`, `ALIAS_MIN_LENGTH`, `ALIAS_MAX_LENGTH` and
 * `RESERVED_SHORT_CODES` in the backend's shortCode constants, and
 * `linkPasswordRules` in its url validator.
 */

const ALIAS_PATTERN = /^[a-zA-Z0-9_-]+$/;
const ALIAS_MIN = 3;
export const ALIAS_MAX = 32;
/** Reserved because short links resolve at the application root. */
const RESERVED_ALIASES = ['api', 'health'];

export function aliasFormatError(alias: string): string | null {
  if (alias.length < ALIAS_MIN || alias.length > ALIAS_MAX) {
    return `Alias must be between ${ALIAS_MIN} and ${ALIAS_MAX} characters`;
  }
  if (!ALIAS_PATTERN.test(alias)) {
    return 'Alias may only contain letters, numbers, hyphens, and underscores';
  }
  if (RESERVED_ALIASES.includes(alias.toLowerCase())) {
    return 'This alias is reserved';
  }
  return null;
}

export const LINK_PASSWORD_MIN = 6;
export const LINK_PASSWORD_MAX = 72;

export function linkPasswordError(password: string): string | null {
  if (!password.trim()) return 'Password cannot be empty or only whitespace';
  if (password.length < LINK_PASSWORD_MIN || password.length > LINK_PASSWORD_MAX) {
    return `Password must be between ${LINK_PASSWORD_MIN} and ${LINK_PASSWORD_MAX} characters`;
  }
  return null;
}

/**
 * Cross-field schedule rules: both dates in the future, expiry strictly after
 * go-live. Returns the two field messages, or nulls when the pair is fine.
 */
export function validateSchedule(liveAt: string, deleteAt: string) {
  const now = Date.now();
  const live = liveAt ? new Date(liveAt).getTime() : null;
  const expiry = deleteAt ? new Date(deleteAt).getTime() : null;

  return {
    liveError:
      live !== null && live <= now ? 'Scheduled live date must be in the future' : null,
    deleteError:
      expiry !== null && expiry <= now
        ? 'Scheduled delete date must be in the future'
        : expiry !== null && live !== null && expiry <= live
          ? 'Expiry must be later than the go-live date'
          : null,
  };
}
