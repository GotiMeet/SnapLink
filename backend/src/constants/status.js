/**
 * @fileoverview Shortened-URL status constants.
 *
 * @module constants/status
 */

// Operational status of a shortened URL.
export const URL_STATUS = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  RECYCLE_BIN: 'recycle_bin',
  DISABLED: 'disabled',
});
