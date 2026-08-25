/**
 * @fileoverview Centralized rate limiting middleware and reusable limiters.
 *
 * BUSINESS PURPOSE:
 * Protects sensitive endpoints (authentication, credential reset, and protected link unlocking)
 * against brute-force attacks, credential stuffing, and email bombing/abuse.
 *
 * ARCHITECTURE & CONVENTIONS:
 * Limiters produce standard HTTP 429 Too Many Requests responses formatted using the
 * project's standardized ApiResponse envelope ({ success: false, message, errors: [] }).
 *
 * @module middleware/rateLimit.middleware
 */
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { sendError } from '../utils/ApiResponse.js';

/**
 * Factory helper to construct standardized rate-limit middleware instances.
 *
 * @function createRateLimiter
 * @param {Object} options - Configuration options for the limiter.
 * @param {number} options.windowMs - Time window in milliseconds.
 * @param {number} options.max - Max requests allowed within the window per key.
 * @param {string} options.message - Custom error message for HTTP 429 responses.
 * @param {Function} [options.keyGenerator] - Custom key generator function.
 * @returns {Function} Express rate limit middleware.
 */
const createRateLimiter = ({
  windowMs,
  max,
  message = 'Too many requests, please try again later.',
  keyGenerator,
}) => {
  const options = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return sendError(res, {
        statusCode: 429,
        message,
      });
    },
  };

  if (keyGenerator) {
    options.keyGenerator = keyGenerator;
  }

  return rateLimit(options);
};

/**
 * Normalizes email strings from the request body or falls back to standard IP.
 * @function emailOrIpKeyGenerator
 */
const emailOrIpKeyGenerator = (req) => {
  if (req.body?.email && typeof req.body.email === 'string') {
    return req.body.email.trim().toLowerCase();
  }
  return ipKeyGenerator(req);
};

/**
 * Register rate limiter: 5 requests per IP per hour.
 * Prevents mass account creation and spam signups.
 */
export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many accounts created from this IP address. Please try again after an hour.',
});

/**
 * Login rate limiter: 10 requests per IP per 15 minutes.
 * Defends against brute-force password guessing and credential stuffing.
 */
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
});

/**
 * Resend verification email rate limiter: 3 requests per email per hour.
 * Defends against email bombing while allowing legitimate users to retry.
 */
export const resendVerificationEmailLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many verification email requests for this address. Please try again after an hour.',
  keyGenerator: emailOrIpKeyGenerator,
});

/**
 * Forgot password rate limiter: 5 requests per email per hour.
 * Prevents inbox spamming and password-reset abuse.
 */
export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many password reset requests for this address. Please try again after an hour.',
  keyGenerator: emailOrIpKeyGenerator,
});

/**
 * Reset password rate limiter: 10 requests per IP per hour.
 * Restricts brute-force reset-token submissions.
 */
export const resetPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many password reset attempts from this IP address. Please try again after an hour.',
});

/**
 * Google OAuth login rate limiter: 10 requests per IP per 15 minutes.
 * Prevents automated abuse of Google OAuth exchange endpoint.
 */
export const googleAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many Google login attempts from this IP address. Please try again after 15 minutes.',
});

/**
 * Protected short link unlock rate limiter: 10 password attempts per IP per 15 minutes.
 * Prevents brute-forcing passwords on password-protected short links.
 */
export const unlockShortLinkLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many unlock attempts from this IP address. Please try again after 15 minutes.',
});
