/**
 * @fileoverview Core authentication service.
 *
 * BUSINESS PURPOSE:
 * Owns every authentication use case — registration, email verification, login,
 * token refresh, logout, password reset, and Google sign-in. This is where the
 * rules live (credential checks, verification gating, account status, session
 * issuance), keeping controllers thin and transport-agnostic.
 *
 * @module services/auth.service
 */
import mongoose from 'mongoose';

import User from '../models/user.model.js';
import { AUTH_PROVIDER } from '../constants/authProvider.js';
import { ACCOUNT_STATUS } from '../constants/accountStatus.js';
import ApiError from '../utils/ApiError.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { hashToken, safeCompare } from '../utils/crypto.js';
import * as tokenService from './token.service.js';
import * as sessionService from './session.service.js';
import { verifyGoogleIdToken } from './google.service.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from './email.service.js';

// Shared for login/credential errors so the message never hints which field failed.
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const USER_NOT_FOUND_MESSAGE = 'User not found';
const PASSWORD_ALREADY_SET_MESSAGE = 'This account already has a password';
const PASSWORD_NOT_SET_MESSAGE =
  'This account has no password yet, set one before changing it';
const CURRENT_PASSWORD_INCORRECT_MESSAGE = 'Current password is incorrect';

/**
 * Creates a session and issues an access + refresh token pair for a user.
 * The session id is minted up front so it can be embedded in the refresh token.
 * @function issueAuthTokens
 */
const issueAuthTokens = async (user, { userAgent, ipAddress }) => {
  const sessionId = new mongoose.Types.ObjectId();
  const accessToken = tokenService.generateAccessToken(user);
  const refreshToken = tokenService.generateRefreshToken(user, sessionId);

  await sessionService.createSession({
    userId: user._id,
    sessionId,
    refreshToken,
    userAgent,
    ipAddress,
  });

  return { accessToken, refreshToken };
};

/**
 * Guards flows that must reject suspended accounts.
 * @function assertAccountActive
 */
const assertAccountActive = (user) => {
  if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
    throw new ApiError(403, 'Your account has been suspended');
  }
};

/**
 * Registers a new local user and sends an email-verification link.
 * @function register
 */
export const register = async ({ fullName, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  const user = await User.create({
    fullName,
    email,
    password: await hashPassword(password),
    authProvider: AUTH_PROVIDER.LOCAL,
    isEmailVerified: false,
  });

  const verificationToken = tokenService.generateEmailVerificationToken(user);
  await sendVerificationEmail(user, verificationToken);

  return user;
};

/**
 * Marks a user's email as verified from a valid verification token.
 * @function verifyEmail
 */
export const verifyEmail = async (token) => {
  const payload = tokenService.verifyEmailVerificationToken(token);

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(400, 'Invalid verification link');
  }

  // Idempotent: re-verifying an already-verified account is a no-op success.
  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save();
  }

  return user;
};

/**
 * Verifies local credentials and issues a session.
 * @function login
 */
export const login = async ({ email, password, userAgent, ipAddress }) => {
  const user = await User.findOne({ email }).select('+password');

  // Password is select:false by default. Holding one is what allows local login,
  // whichever provider created the account, so a Google user who has set a
  // password can sign in either way.
  if (!user || !user.password) {
    throw new ApiError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  assertAccountActive(user);

  const tokens = await issueAuthTokens(user, { userAgent, ipAddress });

  return { user, ...tokens };
};

/**
 * Validates a refresh token against its stored session and rotates the token pair.
 * @function refresh
 */
export const refresh = async ({ refreshToken, userAgent, ipAddress }) => {
  const payload = tokenService.verifyRefreshToken(refreshToken);

  const session = await sessionService.findSessionById(payload.sid);

  if (!session || session.user.toString() !== payload.sub) {
    throw new ApiError(401, 'Session is no longer valid');
  }

  // A token that verifies but does not match the stored hash signals reuse or
  // theft, so the session is revoked defensively.
  if (!safeCompare(hashToken(refreshToken), session.hashedRefreshToken)) {
    await sessionService.revokeSession(session._id);
    throw new ApiError(401, 'Session is no longer valid');
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await sessionService.revokeSession(session._id);
    throw new ApiError(401, 'Session has expired');
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    await sessionService.revokeSession(session._id);
    throw new ApiError(401, 'Session is no longer valid');
  }

  assertAccountActive(user);

  const accessToken = tokenService.generateAccessToken(user);
  const newRefreshToken = tokenService.generateRefreshToken(user, session._id);

  await sessionService.rotateSession({
    session,
    refreshToken: newRefreshToken,
    userAgent,
    ipAddress,
  });

  return { user, accessToken, refreshToken: newRefreshToken };
};

/**
 * Revokes the session tied to the supplied refresh token, if any.
 * @function logout
 */
export const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    return;
  }

  const decoded = tokenService.decodeToken(refreshToken);

  if (decoded?.sid) {
    await sessionService.revokeSessionByToken(decoded.sid, refreshToken);
  }
};

/**
 * Emails a password-reset link for eligible local accounts.
 * @function forgotPassword
 */
export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email }).select('+password');

  // Only local accounts with a password can reset; other cases are ignored so
  // the response cannot be used to enumerate registered emails.
  if (user && user.authProvider === AUTH_PROVIDER.LOCAL && user.password) {
    const resetToken = tokenService.generatePasswordResetToken(user);
    await sendPasswordResetEmail(user, resetToken);
  }
};

/**
 * Sets a new password from a valid reset token and revokes all existing sessions.
 * @function resetPassword
 */
export const resetPassword = async ({ token, newPassword }) => {
  const decoded = tokenService.decodeToken(token);

  if (!decoded?.sub) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const user = await User.findById(decoded.sub).select('+password');

  if (!user || user.authProvider !== AUTH_PROVIDER.LOCAL || !user.password) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // The reset secret is bound to the current password hash, so verification
  // here also proves the token has not already been consumed.
  try {
    tokenService.verifyPasswordResetToken(token, user.password);
  } catch {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  // Invalidate every existing session after a password change.
  await sessionService.revokeAllUserSessions(user._id);
};

/**
 * Reports whether an account merely claimed this email without ever proving it.
 * Such an account was created locally and never completed verification, so
 * nobody has demonstrated they can read mail sent to that address.
 * @function isUnverifiedLocalAccount
 */
const isUnverifiedLocalAccount = (user) =>
  user.authProvider === AUTH_PROVIDER.LOCAL && !user.isEmailVerified;

/**
 * Provisions a fresh account from a verified Google identity.
 * @function createGoogleUser
 */
const createGoogleUser = (profile) =>
  User.create({
    fullName: profile.fullName || profile.email.split('@')[0],
    email: profile.email,
    authProvider: AUTH_PROVIDER.GOOGLE,
    providerId: profile.googleId,
    profilePicture: profile.picture || null,
    isEmailVerified: true,
  });

/**
 * Authenticates a user from a verified Google ID token, provisioning, linking,
 * or replacing the account as the situation requires.
 * @function googleAuth
 */
export const googleAuth = async ({ idToken, userAgent, ipAddress }) => {
  const profile = await verifyGoogleIdToken(idToken);

  if (!profile.email || !profile.emailVerified) {
    throw new ApiError(401, 'Google account email is not verified');
  }

  // The Google id is matched first because it keeps identifying the account
  // after the user changes the address on their Google profile, which a lookup
  // by email would miss and would answer by creating a second account.
  let user = await User.findOne({ providerId: profile.googleId });

  if (!user) {
    const accountOnEmail = await User.findOne({ email: profile.email });

    if (accountOnEmail && isUnverifiedLocalAccount(accountOnEmail)) {
      // The address was claimed here but never proven, while Google has just
      // proven it belongs to whoever is signing in. Handing them that account
      // would leave whoever registered it holding a working password, so the
      // unproven claim is removed and the address starts clean.
      // Such an account can never have signed in, so it owns no data to lose.
      await User.deleteOne({
        _id: accountOnEmail._id,
        authProvider: AUTH_PROVIDER.LOCAL,
        isEmailVerified: false,
      });

      user = await createGoogleUser(profile);
    } else if (accountOnEmail) {
      // A verified account already owns this address, so Google joins it.
      accountOnEmail.providerId = profile.googleId;
      await accountOnEmail.save();

      user = accountOnEmail;
    } else {
      user = await createGoogleUser(profile);
    }
  }

  assertAccountActive(user);

  const tokens = await issueAuthTokens(user, { userAgent, ipAddress });

  return { user, ...tokens };
};

/**
 * Updates the profile fields a user is allowed to change.
 * @function updateProfile
 */
export const updateProfile = async ({ userId, fullName }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, USER_NOT_FOUND_MESSAGE);
  }

  if (fullName !== undefined) {
    user.fullName = fullName;
  }

  await user.save();

  return user;
};

/**
 * Gives an account its first password, so a user created through Google can also
 * sign in with their email. No current password is asked for because there is
 * none, and an existing one is never overwritten here.
 * @function setPassword
 */
export const setPassword = async ({ userId, password }) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ApiError(404, USER_NOT_FOUND_MESSAGE);
  }

  if (user.password) {
    throw new ApiError(409, PASSWORD_ALREADY_SET_MESSAGE);
  }

  user.password = await hashPassword(password);
  await user.save();

  return user;
};

/**
 * Replaces the password of an account that already has one, after proving the
 * caller knows the current one.
 * Only the password changes: the provider fields are left alone, so an account
 * linked to Google keeps signing in that way as well.
 * @function changePassword
 */
export const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ApiError(404, USER_NOT_FOUND_MESSAGE);
  }

  // Nothing to replace yet; that is what the set-password flow is for.
  if (!user.password) {
    throw new ApiError(409, PASSWORD_NOT_SET_MESSAGE);
  }

  const currentPasswordMatches = await comparePassword(oldPassword, user.password);

  if (!currentPasswordMatches) {
    throw new ApiError(401, CURRENT_PASSWORD_INCORRECT_MESSAGE);
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  return user;
};
