/**
 * @fileoverview Session persistence service.
 *
 * BUSINESS PURPOSE:
 * Manages the lifecycle of refresh-token sessions. Only the SHA-256 hash of a
 * refresh token is ever stored, and supporting multiple documents per user is
 * what enables concurrent sessions across devices.
 *
 * @module services/session.service
 */
import Session from '../models/session.model.js';
import config from '../config/env.js';
import { hashToken } from '../utils/crypto.js';

/**
 * Computes a session's absolute expiry from the configured refresh TTL.
 * @function refreshExpiryDate
 */
const refreshExpiryDate = () =>
  new Date(Date.now() + config.jwt.refreshTtl * 1000);

/**
 * Persists a new session, storing only the hashed refresh token and hashed IP.
 * @function createSession
 */
export const createSession = ({ userId, sessionId, refreshToken, userAgent, ipAddress }) =>
  Session.create({
    _id: sessionId,
    user: userId,
    hashedRefreshToken: hashToken(refreshToken),
    expiresAt: refreshExpiryDate(),
    userAgent: userAgent || null,
    hashedIpAddress: ipAddress ? hashToken(ipAddress) : null,
  });

/**
 * Looks up a session by its id.
 * @function findSessionById
 */
export const findSessionById = (sessionId) => Session.findById(sessionId);

/**
 * Rotates an existing session with a new refresh token and refreshed metadata.
 * @function rotateSession
 */
export const rotateSession = ({ session, refreshToken, userAgent, ipAddress }) => {
  session.hashedRefreshToken = hashToken(refreshToken);
  session.expiresAt = refreshExpiryDate();
  session.userAgent = userAgent || null;
  session.hashedIpAddress = ipAddress ? hashToken(ipAddress) : null;
  return session.save();
};

/**
 * Revokes a single session by id.
 * @function revokeSession
 */
export const revokeSession = (sessionId) => Session.deleteOne({ _id: sessionId });

/**
 * Revokes a session only when the supplied token matches the stored hash.
 * @function revokeSessionByToken
 */
export const revokeSessionByToken = (sessionId, refreshToken) =>
  Session.deleteOne({ _id: sessionId, hashedRefreshToken: hashToken(refreshToken) });

/**
 * Revokes every session belonging to a user (e.g. after a password reset).
 * @function revokeAllUserSessions
 */
export const revokeAllUserSessions = (userId) =>
  Session.deleteMany({ user: userId });
