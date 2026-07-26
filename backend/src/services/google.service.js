/**
 * @fileoverview Google OAuth verification service.
 *
 * BUSINESS PURPOSE:
 * Verifies Google-issued ID tokens and normalizes the resulting profile for the
 * auth service. Isolating the google-auth-library dependency here keeps the rest
 * of the auth flow provider-agnostic.
 *
 * @module services/google.service
 */
import { OAuth2Client } from 'google-auth-library';

import config from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const client = new OAuth2Client(config.google.clientId);

/**
 * Verifies a Google ID token and returns a normalized profile.
 * @function verifyGoogleIdToken
 */
export const verifyGoogleIdToken = async (idToken) => {
  if (!config.google.clientId) {
    throw new ApiError(500, 'Google authentication is not configured');
  }

  let ticket;

  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
  } catch {
    throw new ApiError(401, 'Invalid Google credential');
  }

  const payload = ticket.getPayload();

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified,
    fullName: payload.name,
    picture: payload.picture,
  };
};
