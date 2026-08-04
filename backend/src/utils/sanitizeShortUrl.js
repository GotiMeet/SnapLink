/**
 * @fileoverview Short-URL serialization helper.
 *
 * @module utils/sanitizeShortUrl
 */

/**
 * Strips sensitive fields before a short URL is returned in a response.
 * Required because a freshly created document still holds the hashed link
 * password in memory even though the schema hides it from queries.
 * @function sanitizeShortUrl
 */
export const sanitizeShortUrl = (shortUrl) => {
  if (!shortUrl) {
    return null;
  }

  const plainShortUrl =
    typeof shortUrl.toObject === 'function' ? shortUrl.toObject() : { ...shortUrl };

  delete plainShortUrl.password;
  delete plainShortUrl.__v;

  return plainShortUrl;
};
