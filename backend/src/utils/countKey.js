/**
 * @fileoverview Count-map key encoding.
 *
 * BUSINESS PURPOSE:
 * Analytics counters live in MongoDB maps, and map keys travel to the database
 * inside dot-notation update paths. A key holding a dot would be read as a
 * nested path and a leading dollar sign as an operator, so keys are encoded on
 * the way in and decoded on the way out. Referrer hostnames make this routine
 * rather than theoretical.
 *
 * @module utils/countKey
 */
import { MAX_COUNT_KEY_LENGTH } from '../constants/analytics.js';

// Percent stands in for the reserved characters, so it is escaped first and
// unescaped last; the reversed order is what makes the round trip exact.
const ENCODINGS = [
  ['%', '%25'],
  ['.', '%2E'],
  ['$', '%24'],
];

/**
 * Encodes a value into a key that is safe inside an update path.
 * @function encodeCountKey
 */
export const encodeCountKey = (value) =>
  ENCODINGS.reduce(
    (encoded, [character, escaped]) => encoded.split(character).join(escaped),
    String(value).slice(0, MAX_COUNT_KEY_LENGTH)
  );

/**
 * Restores the original value of an encoded key.
 * @function decodeCountKey
 */
export const decodeCountKey = (key) =>
  [...ENCODINGS]
    .reverse()
    .reduce(
      (decoded, [character, escaped]) => decoded.split(escaped).join(character),
      String(key)
    );
