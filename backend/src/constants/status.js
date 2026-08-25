/**
 * @fileoverview Shortened-URL status constants.
 *
 * @module constants/status
 */

// Effective state of a shortened URL.
// ACTIVE: link is live and resolvable.
// INACTIVE: link is scheduled for future activation.
// DELETED_LINK: owner removed the link (soft-deleted).
// DELETED_PROJECT: parent project is soft-deleted.
export const URL_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED_LINK: 'deleted_link',
  DELETED_PROJECT: 'deleted_project',
});
