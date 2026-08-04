/**
 * @fileoverview Short-code generation and alias constraints.
 *
 * @module constants/shortCode
 */

// Look-alike characters (0/O, 1/l/I) are excluded so codes stay easy to read and share.
export const SHORT_CODE_ALPHABET =
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const SHORT_CODE_LENGTH = 7;

// Bounds the retry loop that resolves random short-code collisions.
export const SHORT_CODE_MAX_ATTEMPTS = 5;

export const ALIAS_MIN_LENGTH = 3;

export const ALIAS_MAX_LENGTH = 32;

export const ALIAS_PATTERN = /^[a-zA-Z0-9_-]+$/;

// Reserved because redirects resolve at the application root and must never
// shadow an existing top-level path.
export const RESERVED_SHORT_CODES = Object.freeze(['api', 'health']);
