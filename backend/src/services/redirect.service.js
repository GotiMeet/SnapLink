/**
 * @fileoverview Short link resolution service.
 *
 * BUSINESS PURPOSE:
 * Runs the public redirect flow for an incoming short code: lookup, the status
 * gate, the password gate for private links, and click accounting before the
 * visitor reaches the destination.
 *
 * @module services/redirect.service
 */
import ShortUrl from '../models/shortUrl.model.js';
import { URL_STATUS } from '../constants/status.js';
import { VISIBILITY } from '../constants/visibility.js';
import ApiError from '../utils/ApiError.js';
import { comparePassword } from '../utils/password.js';

const LINK_NOT_FOUND_MESSAGE = 'Short link not found';

/**
 * Records a visit without reading the document back.
 * A single atomic update keeps the counter correct under concurrent traffic.
 * @function registerClick
 */
const registerClick = (shortUrlId) =>
  ShortUrl.updateOne(
    { _id: shortUrlId },
    { $inc: { clickCount: 1 }, $set: { lastAccessedAt: new Date() } }
  );

/**
 * Resolves a short code to its destination, enforcing every access rule.
 * The link password is only supplied by the unlock endpoint.
 * @function resolveShortLink
 */
export const resolveShortLink = async ({ shortCode, password }) => {
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

  await registerClick(shortUrl._id);

  return shortUrl.originalUrl;
};
