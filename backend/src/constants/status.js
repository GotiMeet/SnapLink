/**
 * @fileoverview Shortened-URL status constants.
 *
 * @module constants/status
 */

// Effective state of a shortened URL. DELETED_LINK is set when the owner removes
// the link itself, DELETED_PROJECT when its parent project is soft-deleted.
export const URL_STATUS = Object.freeze({
  ACTIVE: 'active',
  DELETED_LINK: 'deleted_link',
  DELETED_PROJECT: 'deleted_project',
});
