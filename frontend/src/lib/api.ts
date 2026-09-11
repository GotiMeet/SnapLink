/**
 * The only module in the app that talks to the network.
 *
 * Responsibilities (PROJECT_MASTER.md section 10) and nothing else:
 *   1. Prefix {VITE_API_URL}/api/v1
 *   2. credentials: 'include' on every request — cookies are the entire auth mechanism
 *   3. JSON content type when a body is present
 *   4. Unwrap { success, message, data } and return `data`
 *   5. Throw a typed ApiError on non-2xx
 *   6. 401 -> refresh once -> replay, de-duplicated across concurrent requests
 *   7. Signal session expiry when refresh fails
 *   8. Never attempt refresh for endpoints where a 401 is a real credential failure
 */

import { env } from '@/env';
import type { ApiFailure, ApiSuccess, FieldError } from '@/types/api';
import { emitSessionExpired } from './session';

const API_BASE = `${env.apiUrl}/api/v1`;

/**
 * Endpoints where a 401 means "these credentials are wrong", not "your access
 * token expired". Refreshing on these would fire a pointless request and then
 * replay a call that fails identically.
 *
 * `/auth/me` is deliberately NOT here: a 401 there is exactly the case where a
 * valid refresh cookie should mint a new access token.
 */
const NO_REFRESH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/resend-verification-email',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldError[];

  constructor(status: number, message: string, errors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** Message for a specific form field, for rendering 422s inline. */
  fieldError(field: string): string | undefined {
    return this.errors.find((error) => error.field === field)?.message;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/**
 * In-flight refresh, shared by every caller.
 *
 * Three requests failing with 401 at the same moment must produce ONE call to
 * /auth/refresh, not three. Three would rotate the refresh token three times;
 * the backend treats a token that verifies but no longer matches the stored
 * hash as theft and revokes the session, so the naive version logs the user out.
 */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Set once a refresh has actually failed. Sharing the in-flight promise alone
 * is not enough: requests that 401 *after* the first refresh already settled
 * would each start another one, so a dead session produced a burst of pointless
 * refresh attempts and repeated session-expired signals. Once the refresh token
 * is rejected it will not start working again on its own, so short-circuit
 * until something re-authenticates.
 */
let sessionDead = false;

const refreshSession = (): Promise<boolean> => {
  if (sessionDead) return Promise.resolve(false);

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) sessionDead = true;
        return response.ok;
      })
      .catch(() => {
        // Network failure. Treat as unauthenticated but recoverable: a dropped
        // connection should not permanently wedge the client.
        return false;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};

/**
 * Clears the dead-session latch. Called after any successful authentication so
 * a new session can refresh normally.
 */
export const resetSessionState = (): void => {
  sessionDead = false;
};

const parseFailure = async (response: Response): Promise<ApiError> => {
  try {
    const body = (await response.json()) as Partial<ApiFailure>;
    return new ApiError(
      response.status,
      body.message ?? response.statusText,
      body.errors ?? []
    );
  } catch {
    // 5xx from a proxy, or an empty body: there is no envelope to read.
    return new ApiError(response.status, response.statusText || 'Request failed');
  }
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Query string values. Undefined and null entries are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

const buildUrl = (base: string, path: string, params?: RequestOptions['params']) => {
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

const send = (url: string, options: RequestOptions): Promise<Response> =>
  fetch(url, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers:
      options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    ...(options.signal ? { signal: options.signal } : {}),
  });

/**
 * Issue a request against the versioned API and return the unwrapped `data`.
 * Throws ApiError on any non-2xx response.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(API_BASE, path, options.params);
  let response = await send(url, options);

  if (response.status === 401 && !NO_REFRESH_PATHS.has(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await send(url, options);
    } else {
      // The refresh cookie is gone or rejected. Tell the app once, then let the
      // caller handle the error; ProtectedRoute performs the actual redirect.
      emitSessionExpired();
    }
  }

  if (!response.ok) {
    throw await parseFailure(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiSuccess<T>;
  return body.data;
}

/**
 * `GET /urls/:urlId/qr` answers with a binary PNG instead of the JSON envelope,
 * so it cannot go through `request`. Errors still arrive as JSON.
 */
export async function requestBlob(path: string): Promise<Blob> {
  const url = `${API_BASE}${path}`;
  let response = await fetch(url, { credentials: 'include' });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(url, { credentials: 'include' });
    } else {
      emitSessionExpired();
    }
  }

  if (!response.ok) {
    throw await parseFailure(response);
  }

  return response.blob();
}

/**
 * The password-gate unlock endpoint lives at the ROOT domain (`POST /:shortCode`),
 * not under /api/v1, so it needs its own base. It is unauthenticated and must
 * never trigger a refresh.
 *
 * `src` carries the QR marker through the gate. Dropping it would record an
 * unlocked scan as an ordinary click.
 */
export async function requestPublic<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = buildUrl(env.appUrl, path, options.params);
  const response = await send(url, options);

  if (!response.ok) {
    throw await parseFailure(response);
  }

  const body = (await response.json()) as ApiSuccess<T>;
  return body.data;
}
