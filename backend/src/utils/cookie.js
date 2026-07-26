/**
 * @fileoverview Authentication cookie helpers.
 *
 * BUSINESS PURPOSE:
 * Centralizes how access and refresh tokens are written to and cleared from
 * HTTP-only cookies, keeping cookie flags and paths identical across handlers
 * (mismatched options are a common reason clear-cookie silently fails).
 *
 * @module utils/cookie
 */
import config from '../config/env.js';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

// The refresh cookie is scoped to the auth routes so it is not sent elsewhere.
const REFRESH_TOKEN_COOKIE_PATH = `${config.apiPrefix}/auth`;

/**
 * Shared cookie flags applied to both authentication cookies.
 * @function baseCookieOptions
 */
const baseCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  domain: config.cookie.domain,
});

/**
 * Writes the access and refresh token cookies with matching flags.
 * @function setAuthCookies
 */
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),
    path: '/',
    maxAge: config.jwt.accessTtl * 1000,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: config.jwt.refreshTtl * 1000,
  });
};

/**
 * Clears the access and refresh token cookies using the same flags they were set with.
 * @function clearAuthCookies
 */
export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseCookieOptions(), path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions(),
    path: REFRESH_TOKEN_COOKIE_PATH,
  });
};
