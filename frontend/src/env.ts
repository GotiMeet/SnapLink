/**
 * Environment configuration, validated once at module load.
 *
 * Failing loudly here beats failing mysteriously later: an unset VITE_API_URL
 * otherwise surfaces as every request 404ing against the dev server itself.
 */

const read = (key: string, value: string | undefined): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `Missing required environment variable ${key}. Copy .env.example to .env and fill it in.`
    );
  }
  return trimmed.replace(/\/+$/, '');
};

export const env = {
  /** Backend origin. The API client appends `/api/v1`. */
  apiUrl: read('VITE_API_URL', import.meta.env.VITE_API_URL),

  /**
   * Origin that short links resolve from. Used to display short URLs and as the
   * base for the password-gate unlock POST, which sits at the root domain
   * rather than under /api/v1.
   */
  appUrl: read('VITE_APP_URL', import.meta.env.VITE_APP_URL),

  /**
   * Optional so the app still boots without Google sign-in configured; the
   * button is hidden when this is empty rather than rendering a broken control.
   */
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '',
} as const;

export const isGoogleAuthEnabled = env.googleClientId.length > 0;
