/**
 * @fileoverview Short link resolution service.
 *
 * BUSINESS PURPOSE:
 * Runs the public redirect flow for an incoming short code: lookup, the status
 * gate, the password gate for private links, and visit accounting before the
 * visitor reaches the destination. A visit only reaches analytics once every
 * gate has passed, so refused requests never appear in a report.
 *
 * @module services/redirect.service
 */
import ShortUrl from '../models/shortUrl.model.js';
import { URL_STATUS } from '../constants/status.js';
import { VISIBILITY } from '../constants/visibility.js';
import ApiError from '../utils/ApiError.js';
import { comparePassword } from '../utils/password.js';
import * as analyticsService from './analytics.service.js';

const LINK_NOT_FOUND_MESSAGE = 'Short link not found';

/**
 * Stamps when the link was last used, without reading the document back.
 * Only the timestamp lives here; how often a link was used is counted by the
 * analytics collection, which is the single source of that figure.
 * @function touchLastAccessed
 */
const touchLastAccessed = (shortUrlId) =>
  ShortUrl.updateOne({ _id: shortUrlId }, { $set: { lastAccessedAt: new Date() } });

/**
 * Folds the visit into the day's analytics.
 * Reporting is secondary to reaching the destination, so a failure here is
 * logged and swallowed rather than turned into an error for the visitor.
 * @function recordVisitSafely
 */
const recordVisitSafely = async (shortUrl, visit) => {
  try {
    await analyticsService.recordVisit({ shortUrl, ...visit });
  } catch (error) {
    console.error(
      `Failed to record analytics for short URL ${shortUrl._id}: ${error?.message || error}`
    );
  }
};

/**
 * Resolves a short code to its destination, enforcing every access rule.
 * The link password is only supplied by the unlock endpoint, and the visit
 * context carries what analytics classifies the visitor by.
 * @function resolveShortLink
 */
export const resolveShortLink = async ({ shortCode, password, visit = {} }) => {
  const shortUrl = await ShortUrl.findOne({ shortCode }).select('+password');

  // Only a live link resolves. The stored status already carries the effective
  // state, including a link taken offline by its parent project, so no project
  // lookup is needed. Every other state is reported as missing so a deleted code
  // leaks nothing about the link behind it.
  if (!shortUrl || shortUrl.status !== URL_STATUS.ACTIVE) {
    throw new ApiError(404, LINK_NOT_FOUND_MESSAGE);
  }

  if (shortUrl.visibility === VISIBILITY.PRIVATE && shortUrl.password) {
    if (!password) {
      throw new ApiError(401, 'This link is password protected');
    }

    const passwordMatches = await comparePassword(password, shortUrl.password);

    if (!passwordMatches) {
      throw new ApiError(401, 'Incorrect password');
    }
  }

  await touchLastAccessed(shortUrl._id);
  await recordVisitSafely(shortUrl, visit);

  return shortUrl.originalUrl;
};
