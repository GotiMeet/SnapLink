/**
 * @fileoverview Token-type constants shared by the JWT service.
 *
 * @module constants/tokenType
 */

// Distinguishes the purpose of a signed JWT so tokens cannot be used across flows.
export const TOKEN_TYPE = Object.freeze({
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
});
