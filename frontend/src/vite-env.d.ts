/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Support channels shown on /contact. A missing one is simply not rendered. */
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_REPO_URL?: string;
  /** Deployed public origin. Build-time only, for robots.txt and sitemap.xml. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
