/**
 * @fileoverview Hashing helpers for high-entropy secrets.
 *
 * @module utils/crypto
 */
import crypto from 'node:crypto';

/**
 * Hashes a value with SHA-256. Suitable here because refresh tokens are
 * high-entropy secrets that do not need a slow, salted hash.
 * @function hashToken
 */
export const hashToken = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

/**
 * Constant-time equality check to avoid leaking match progress via timing.
 * @function safeCompare
 */
export const safeCompare = (a, b) => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
};
