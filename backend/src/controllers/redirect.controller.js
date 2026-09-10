/**
 * @fileoverview HTTP controllers for public short link resolution.
 *
 * SEPARATION OF CONCERNS (WHY):
 * These are the only handlers that answer outside the versioned API, so they
 * stay limited to issuing the redirect or returning the unlocked destination
 * while the resolution rules live in the redirect service.
 *
 * BROWSER VS API CLIENTS (WHY):
 * A browser cannot act on the JSON error a refused lookup produces, so one is
 * sent to the matching client page instead. This is a rendering choice only:
 * the service has already refused by the time the branch is reached, and no
 * destination was ever read. Every non-browser caller keeps the exact JSON
 * response it received before.
 *
 * @module controllers/redirect.controller
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import config from '../config/env.js';
import { VISIT_SOURCE } from '../constants/analytics.js';
import * as redirectService from '../services/redirect.service.js';

// Client routes a browser is sent to when a short code does not resolve directly.
const UNLOCK_PATH = 'unlock';
const LINK_UNAVAILABLE_PATH = 'link-unavailable';

/**
 * Collects what analytics classifies a visit by. Nothing here is stored as sent:
 * the service reduces each value to a bucket before it reaches the database.
 * @function getVisitContext
 */
const getVisitContext = (req) => ({
  source: req.query.src,
  userAgent: req.headers['user-agent'],
  referrer: req.headers.referer || req.headers.referrer,
  language: req.headers['accept-language'],
});

/**
 * Prevents browser/proxy caching so every visit hits the backend and is counted,
 * and so a gate redirect is never replayed from cache.
 * @function setNoStoreHeaders
 */
const setNoStoreHeaders = (res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
};

/**
 * Reports whether the caller is a browser asking for a page.
 * Listing JSON first means a client sending "*\/*" (curl, Postman, fetch without
 * an Accept header) resolves to JSON and keeps its current response; only a
 * caller that explicitly prefers HTML is sent to a page.
 * @function wantsHtml
 */
const wantsHtml = (req) => req.accepts(['json', 'html']) === 'html';

/**
 * Builds the client URL that renders the password gate.
 * Composed entirely from server-side values: the origin comes from config, the
 * short code is encoded, and the QR marker is appended only when the incoming
 * value matched the known marker exactly, so nothing a visitor sent is reflected
 * into the address the browser is sent to.
 * @function buildUnlockUrl
 */
const buildUnlockUrl = (shortCode, source) => {
  const target = `${config.clientUrl}/${UNLOCK_PATH}/${encodeURIComponent(shortCode)}`;

  // The marker has to survive the gate, or unlocking a link that was scanned
  // would be recorded as an ordinary click instead of a QR scan.
  return source === VISIT_SOURCE.QR ? `${target}?src=${VISIT_SOURCE.QR}` : target;
};

/**
 * Builds the client URL shown when a short code resolves to nothing.
 * @function buildLinkUnavailableUrl
 */
const buildLinkUnavailableUrl = () => `${config.clientUrl}/${LINK_UNAVAILABLE_PATH}`;

/**
 * Resolves a short code and redirects the visitor to the destination.
 * A browser that cannot be resolved directly is sent to the password gate (401)
 * or the unavailable-link page (404); the destination is never disclosed here.
 * @function redirectToOriginalUrl
 * @route GET /:shortCode
 * @access Public
 */
export const redirectToOriginalUrl = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;
  let originalUrl;

  try {
    originalUrl = await redirectService.resolveShortLink({
      shortCode,
      visit: getVisitContext(req),
    });
  } catch (error) {
    const isGateable = error.statusCode === 401 || error.statusCode === 404;

    // Anything else, and every non-browser caller, travels on to the global
    // error handler exactly as before.
    if (!isGateable || !wantsHtml(req)) {
      throw error;
    }

    setNoStoreHeaders(res);

    return res.redirect(
      302,
      error.statusCode === 401
        ? buildUnlockUrl(shortCode, req.query.src)
        : buildLinkUnavailableUrl()
    );
  }

  setNoStoreHeaders(res);

  // A temporary redirect keeps clients coming back so visits stay countable.
  return res.redirect(302, originalUrl);
});

/**
 * Unlocks a password-protected link and returns its destination.
 * @function unlockShortLink
 * @route POST /:shortCode
 * @access Public
 */
export const unlockShortLink = asyncHandler(async (req, res) => {
  const originalUrl = await redirectService.resolveShortLink({
    shortCode: req.params.shortCode,
    password: req.body.password,
    visit: getVisitContext(req),
  });

  return sendSuccess(res, {
    message: 'Short link unlocked successfully',
    data: { originalUrl },
  });
});
