/**
 * @fileoverview HTTP controllers for public short link resolution.
 *
 * SEPARATION OF CONCERNS (WHY):
 * These are the only handlers that answer outside the versioned API, so they
 * stay limited to issuing the redirect or returning the unlocked destination
 * while the resolution rules live in the redirect service.
 *
 * @module controllers/redirect.controller
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as redirectService from '../services/redirect.service.js';

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
 * Resolves a short code and redirects the visitor to the destination.
 * @function redirectToOriginalUrl
 * @route GET /:shortCode
 * @access Public
 */
export const redirectToOriginalUrl = asyncHandler(async (req, res) => {
  const originalUrl = await redirectService.resolveShortLink({
    shortCode: req.params.shortCode,
    visit: getVisitContext(req),
  });

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
