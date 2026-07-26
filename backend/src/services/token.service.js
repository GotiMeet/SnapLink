/**
 * @fileoverview JSON Web Token service.
 *
 * BUSINESS PURPOSE:
 * Centralizes signing and verification for every token the auth system issues
 * (access, refresh, email-verification, password-reset). Each token type has its
 * own secret and a mandatory `type` claim so a token minted for one flow can
 * never be replayed in another.
 *
 * @module services/token.service
 */
import jwt from 'jsonwebtoken';

import config from '../config/env.js';
import { TOKEN_TYPE } from '../constants/tokenType.js';
import ApiError from '../utils/ApiError.js';

/**
 * Signs a payload with the given secret and TTL (seconds).
 * @function signToken
 */
const signToken = (payload, secret, ttlSeconds) =>
  jwt.sign(payload, secret, { expiresIn: ttlSeconds });

/**
 * Verifies a token's signature/expiry and asserts it matches the expected type.
 * @function verifyToken
 */
const verifyToken = (token, secret, expectedType) => {
  let payload;

  try {
    payload = jwt.verify(token, secret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  // Reject tokens issued for a different flow even if the signature is valid.
  if (payload.type !== expectedType) {
    throw new ApiError(401, 'Invalid token type');
  }

  return payload;
};

/**
 * Decodes a token without verifying it (used to read claims before validation).
 * @function decodeToken
 */
export const decodeToken = (token) => jwt.decode(token);

/**
 * Generates a short-lived access token.
 * @function generateAccessToken
 */
export const generateAccessToken = (user) =>
  signToken(
    { sub: user._id.toString(), role: user.role, type: TOKEN_TYPE.ACCESS },
    config.jwt.accessSecret,
    config.jwt.accessTtl
  );

/**
 * Generates a refresh token bound to a specific session id.
 * @function generateRefreshToken
 */
export const generateRefreshToken = (user, sessionId) =>
  signToken(
    { sub: user._id.toString(), sid: sessionId.toString(), type: TOKEN_TYPE.REFRESH },
    config.jwt.refreshSecret,
    config.jwt.refreshTtl
  );

/**
 * Generates an email-verification token.
 * @function generateEmailVerificationToken
 */
export const generateEmailVerificationToken = (user) =>
  signToken(
    { sub: user._id.toString(), type: TOKEN_TYPE.EMAIL_VERIFICATION },
    config.jwt.emailVerificationSecret,
    config.jwt.emailVerificationTtl
  );

/**
 * Generates a password-reset token.
 * @function generatePasswordResetToken
 */
// The reset secret is bound to the current password hash, so the token becomes
// invalid as soon as the password changes (single-use without extra storage).
export const generatePasswordResetToken = (user) =>
  signToken(
    { sub: user._id.toString(), type: TOKEN_TYPE.PASSWORD_RESET },
    `${config.jwt.passwordResetSecret}${user.password}`,
    config.jwt.passwordResetTtl
  );

/**
 * Verifies an access token.
 * @function verifyAccessToken
 */
export const verifyAccessToken = (token) =>
  verifyToken(token, config.jwt.accessSecret, TOKEN_TYPE.ACCESS);

/**
 * Verifies a refresh token.
 * @function verifyRefreshToken
 */
export const verifyRefreshToken = (token) =>
  verifyToken(token, config.jwt.refreshSecret, TOKEN_TYPE.REFRESH);

/**
 * Verifies an email-verification token.
 * @function verifyEmailVerificationToken
 */
export const verifyEmailVerificationToken = (token) =>
  verifyToken(token, config.jwt.emailVerificationSecret, TOKEN_TYPE.EMAIL_VERIFICATION);

/**
 * Verifies a password-reset token against the user's current password hash.
 * @function verifyPasswordResetToken
 */
export const verifyPasswordResetToken = (token, passwordHash) =>
  verifyToken(
    token,
    `${config.jwt.passwordResetSecret}${passwordHash}`,
    TOKEN_TYPE.PASSWORD_RESET
  );
