import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/** Public marketing and entry routes. Everything else is disallowed below. */
const PUBLIC_ROUTES = ['/', '/features', '/about', '/contact', '/signup', '/login'];

/*
 * Paths a crawler has no business in. The app is one bundle on one origin, so
 * robots.txt is the only thing standing between a crawler and /app — and the
 * gate and token-bearing screens would leak short codes and single-use tokens
 * into an index.
 */
const DISALLOWED = [
  '/app/',
  '/unlock/',
  '/link-unavailable',
  '/verify-email',
  '/reset-password',
];

const buildRobots = (siteUrl: string) =>
  [
    '# SnapLink',
    '',
    'User-agent: *',
    ...DISALLOWED.map((path) => `Disallow: ${path}`),
    '',
    // A relative Sitemap directive is not valid, so it is only written when the
    // deployed origin is actually known.
    siteUrl
      ? `Sitemap: ${siteUrl}/sitemap.xml`
      : '# Sitemap: set VITE_SITE_URL to emit one',
    '',
  ].join('\n');

const buildSitemap = (siteUrl: string) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...PUBLIC_ROUTES.map(
      (route) => `  <url><loc>${siteUrl}${route === '/' ? '' : route}/</loc></url>`
    ),
    '</urlset>',
    '',
  ].join('\n');

/**
 * Emits robots.txt, and sitemap.xml when the deployed origin is configured.
 *
 * Both are generated rather than checked in as static files because a sitemap
 * requires absolute URLs: a committed one would either hard-code a domain this
 * project does not own, or ship URLs no crawler can use.
 */
function seoFiles(siteUrl: string): Plugin {
  return {
    name: 'snaplink-seo-files',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: buildRobots(siteUrl),
      });
      if (siteUrl) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: buildSitemap(siteUrl),
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // Public origin of the deployed frontend, used only for the SEO files.
  const siteUrl = (loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? '')
    .trim()
    .replace(/\/+$/, '');

  return {
    plugins: [react(), seoFiles(siteUrl)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 5173,
      strictPort: true,
    },
  };
});
