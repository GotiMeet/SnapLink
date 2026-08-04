/**
 * @fileoverview Short-code generation helper.
 *
 * @module utils/shortCode
 */
import crypto from 'node:crypto';

import {
  SHORT_CODE_ALPHABET,
  SHORT_CODE_LENGTH,
} from '../constants/shortCode.js';

/**
 * Generates a random short code from the configured alphabet.
 * A cryptographic random source is used so codes are not predictable from one another.
 * @function generateShortCode
 */
export const generateShortCode = (length = SHORT_CODE_LENGTH) => {
  let shortCode = '';

  for (let index = 0; index < length; index += 1) {
    shortCode += SHORT_CODE_ALPHABET[crypto.randomInt(SHORT_CODE_ALPHABET.length)];
  }

  return shortCode;
};
