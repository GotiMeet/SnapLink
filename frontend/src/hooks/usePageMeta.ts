import { useEffect } from 'react';

/**
 * Per-route document title, description and indexing directive.
 *
 * Done imperatively rather than with a head-management library: PROJECT_MASTER
 * section 6 admits a dependency only against a stated requirement, and the
 * requirement here — "one h1, semantic landmarks, per-route title/description"
 * (section 14) — is three DOM writes.
 *
 * `noindex` exists because the app is a single-page bundle served from one
 * origin: robots.txt keeps crawlers out of /app, but a directive on the page
 * itself is what stops an already-fetched URL being indexed. Everything behind
 * the sign-in wall, the password gate, and the token-bearing auth screens set
 * it; the marketing pages do not.
 */
const BRAND = 'SnapLink';
const DEFAULT_DESCRIPTION =
  'Shorten URLs, organise them into projects, protect them with passwords, and track clicks and QR scans with privacy-first analytics.';

const setMeta = (name: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
};

export function usePageMeta({
  title,
  description,
  noindex = false,
}: {
  /** Page name; the brand is appended. Omit on the home page. */
  title?: string;
  description?: string;
  noindex?: boolean;
}) {
  useEffect(() => {
    document.title = title
      ? `${title} · ${BRAND}`
      : `${BRAND} — Link management and analytics`;
    setMeta('description', description ?? DEFAULT_DESCRIPTION);
    // `follow` still lets a crawler traverse public links it finds here.
    setMeta('robots', noindex ? 'noindex, follow' : 'index, follow');
  }, [title, description, noindex]);
}
