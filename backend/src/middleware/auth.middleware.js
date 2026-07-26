/**
 * @fileoverview Authentication middleware for protected routes.
 *
 * BUSINESS PURPOSE:
 * Guards private endpoints by validating the access-token cookie, loading the
 * corresponding user, and rejecting missing/invalid tokens or suspended accounts
 * before any protected handler runs.
 *
 * @module middleware/auth.middleware
 */
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ACCESS_TOKEN_COOKIE } from '../utils/cookie.js';
import { verifyAccessToken } from '../services/token.service.js';
import { ACCOUNT_STATUS } from '../constants/accountStatus.js';
import User from '../models/user.model.js';

/**
 * Requires a valid access token and attaches the authenticated user to the request.
 * @function authMiddleware
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  const payload = verifyAccessToken(token);

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Your account has been suspended');
  }

  req.user = user;
  next();
});

export default authMiddleware;
