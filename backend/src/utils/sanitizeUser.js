/**
 * @fileoverview User-serialization helper.
 *
 * @module utils/sanitizeUser
 */

/**
 * Strips sensitive fields before a user document is returned in a response.
 * @function sanitizeUser
 */
export const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const plainUser =
    typeof user.toObject === 'function' ? user.toObject() : { ...user };

  delete plainUser.password;
  delete plainUser.__v;

  return plainUser;
};
