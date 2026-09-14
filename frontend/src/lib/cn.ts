/**
 * Join conditional class names.
 *
 * Deliberately not clsx + tailwind-merge: with only first-party components,
 * class conflicts are avoidable by construction. If overriding utilities from a
 * caller's `className` ever becomes a real pattern, revisit then — not before.
 */
export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');
