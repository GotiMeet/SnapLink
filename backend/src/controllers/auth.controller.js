/**
 * @fileoverview HTTP controllers for the authentication module.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Each handler stays thin: it reads the request, delegates all business logic to
 * the auth service, and is the only layer aware of transport concerns such as
 * setting or clearing authentication cookies. Keeping cookie/response handling
 * here (and logic in the service) makes both sides independently testable.
 *
 * @module controllers/auth.controller
 */
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from '../utils/cookie.js';
import * as authService from '../services/auth.service.js';

/**
 * Collects request metadata persisted with a session for auditing and rotation.
 * @function getClientContext
 */
const getClientContext = (req) => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
});

/**
 * Registers a new local account and triggers the email-verification flow.
 * @function register
 * @route POST /api/v1/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  await authService.register({ fullName, email, password });

  return sendSuccess(res, {
    statusCode: 201,
    message:
      'Registration successful. Please check your email to verify your account.',
  });
});

/**
 * Confirms ownership of an email address using the emailed verification token.
 * @function verifyEmail
 * @route POST /api/v1/auth/verify-email
 * @access Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body.token);

  return sendSuccess(res, {
    message: 'Email verified successfully. You can now log in.',
  });
});

/**
 * Authenticates a local user and starts a session.
 * @function login
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({
    email,
    password,
    ...getClientContext(req),
  });

  // Tokens are delivered as HTTP-only cookies so client-side JS cannot read them.
  setAuthCookies(res, { accessToken, refreshToken });

  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: { user: sanitizeUser(user) },
  });
});

/**
 * Issues a fresh access/refresh pair from a valid refresh cookie (rotation).
 * @function refresh
 * @route POST /api/v1/auth/refresh
 * @access Public
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is missing');
  }

  const {
    user,
    accessToken,
    refreshToken: rotatedRefreshToken,
  } = await authService.refresh({ refreshToken, ...getClientContext(req) });

  // Rotation invalidates the old refresh token, so both cookies are overwritten.
  setAuthCookies(res, { accessToken, refreshToken: rotatedRefreshToken });

  return sendSuccess(res, {
    message: 'Token refreshed successfully',
    data: { user: sanitizeUser(user) },
  });
});

/**
 * Ends the current session and clears authentication cookies.
 * @function logout
 * @route POST /api/v1/auth/logout
 * @access Public
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  await authService.logout({ refreshToken });

  clearAuthCookies(res);

  return sendSuccess(res, { message: 'Logged out successfully' });
});

/**
 * Starts the password-reset flow by emailing a reset link when applicable.
 * @function forgotPassword
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword({ email: req.body.email });

  // Always return a generic message so the response cannot reveal which emails exist.
  return sendSuccess(res, {
    message:
      'If an account exists for that email, a password reset link has been sent.',
  });
});

/**
 * Sets a new password using a valid reset token and clears any active session cookies.
 * @function resetPassword
 * @route POST /api/v1/auth/reset-password
 * @access Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword({ token, newPassword: password });

  clearAuthCookies(res);

  return sendSuccess(res, {
    message: 'Password reset successful. Please log in with your new password.',
  });
});

/**
 * Authenticates (or provisions) a user from a verified Google ID token.
 * @function googleAuth
 * @route POST /api/v1/auth/google
 * @access Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.googleAuth({
    idToken: req.body.idToken,
    ...getClientContext(req),
  });

  setAuthCookies(res, { accessToken, refreshToken });

  return sendSuccess(res, {
    message: 'Logged in with Google successfully',
    data: { user: sanitizeUser(user) },
  });
});

/**
 * Returns the currently authenticated user (populated by the auth middleware).
 * @function me
 * @route GET /api/v1/auth/me
 * @access Private
 */
export const me = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: { user: sanitizeUser(req.user) } })
);

/**
 * Updates the authenticated user's profile.
 * @function updateProfile
 * @route PATCH /api/v1/auth/me
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile({
    userId: req.user._id,
    fullName: req.body.fullName,
  });

  return sendSuccess(res, {
    message: 'Profile updated successfully',
    data: { user: sanitizeUser(user) },
  });
});

/**
 * Gives an account without a password its first one.
 * @function setPassword
 * @route POST /api/v1/auth/set-password
 * @access Private
 */
export const setPassword = asyncHandler(async (req, res) => {
  const user = await authService.setPassword({
    userId: req.user._id,
    password: req.body.password,
  });

  return sendSuccess(res, {
    message: 'Password set successfully. You can now also log in with your email and password.',
    data: { user: sanitizeUser(user) },
  });
});

/**
 * Replaces the authenticated user's password.
 * @function changePassword
 * @route POST /api/v1/auth/change-password
 * @access Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await authService.changePassword({
    userId: req.user._id,
    oldPassword,
    newPassword,
  });

  return sendSuccess(res, {
    message: 'Password changed successfully',
    data: { user: sanitizeUser(user) },
  });
});
