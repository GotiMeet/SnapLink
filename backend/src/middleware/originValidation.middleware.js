/**
 * @fileoverview Origin validation middleware for CSRF protection.
 *
 * BUSINESS PURPOSE:
 * In production, the frontend (e.g. Vercel) and backend (e.g. Railway) sit on
 * separate domains, requiring SameSite=None authentication cookies. To protect
 * against Cross-Site Request Forgery (CSRF), this middleware verifies that all
 * state-changing requests (POST, PATCH, PUT, DELETE) originate exclusively from
 * the configured client domain.
 *
 * NON-BROWSER CLIENTS (WHY PERMITTED):
 * Browsers strictly enforce and attach the `Origin` header on cross-origin mutation
 * requests and cannot be suppressed or spoofed by client-side script. Trusted
 * non-browser tools (such as Postman, server-to-server calls, or curl) do not send
 * an Origin header, allowing development and automated testing to function seamlessly.
 *
 * @module middleware/originValidation.middleware
 */
import config from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Normalizes an origin string by extracting scheme + host + port (lowercased, no trailing slash).
 * @param {string} url - The URL or origin string to normalize.
 * @returns {string} Normalized origin.
 */
const normalizeOrigin = (url) => {
  if (!url) return '';
  try {
    return new URL(url).origin.toLowerCase();
  } catch {
    return String(url).trim().replace(/\/+$/, '').toLowerCase();
  }
};

/**
 * Builds the set of permitted client origins from config.
 * @returns {Set<string>} Permitted origins.
 */
const getAllowedOrigins = () => {
  const allowed = new Set();

  if (config.clientUrl) {
    allowed.add(normalizeOrigin(config.clientUrl));
  }

  if (config.corsOrigin) {
    const origins = String(config.corsOrigin).split(',');
    origins.forEach((o) => {
      const normalized = normalizeOrigin(o);
      if (normalized) {
        allowed.add(normalized);
      }
    });
  }

  return allowed;
};

/**
 * Validates request Origin / Referer against allowed client origins on state-changing requests.
 * @function originValidationMiddleware
 */
const originValidationMiddleware = (req, res, next) => {
  // Safe, idempotent HTTP methods (GET, HEAD, OPTIONS) do not mutate server state.
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const rawOrigin = req.headers.origin;
  const rawReferer = req.headers.referer || req.headers.referrer;

  let requestOrigin = '';

  if (rawOrigin) {
    requestOrigin = normalizeOrigin(rawOrigin);
  } else if (rawReferer) {
    try {
      requestOrigin = new URL(rawReferer).origin.toLowerCase();
    } catch {
      requestOrigin = normalizeOrigin(rawReferer);
    }
  }

  // If no Origin or Referer is present, it is a non-browser client (e.g. Postman, curl, backend test).
  // Modern browsers unconditionally attach Origin/Referer on cross-origin mutation requests.
  if (!requestOrigin) {
    return next();
  }

  const allowedOrigins = getAllowedOrigins();

  if (!allowedOrigins.has(requestOrigin)) {
    throw new ApiError(403, 'Cross-site request forgery forbidden: untrusted origin');
  }

  next();
};

export default originValidationMiddleware;
