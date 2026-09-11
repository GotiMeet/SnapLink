/**
 * The account-password rules, mirrored from `passwordRules` in the backend's
 * auth validator: 8-72 characters, at least one letter, at least one number.
 *
 * Deliberately the real rules rather than a "strength" score. A meter invents a
 * number the server never computes, so it can read "strong" on a password the
 * API will reject.
 *
 * The client check is a courtesy, not a gate — the server validates every
 * submission regardless.
 */

export const PASSWORD_RULES = [
  { label: '8 to 72 characters', test: (v: string) => v.length >= 8 && v.length <= 72 },
  { label: 'At least one letter', test: (v: string) => /[A-Za-z]/.test(v) },
  { label: 'At least one number', test: (v: string) => /\d/.test(v) },
] as const;

/** Whether a password satisfies every rule the API enforces. */
export const isPasswordValid = (value: string): boolean =>
  PASSWORD_RULES.every((rule) => rule.test(value));
