/**
 * @fileoverview Password hashing helpers (bcrypt).
 *
 * @module utils/password
 */
import bcrypt from 'bcrypt';

import config from '../config/env.js';

/**
 * Hashes a plaintext password using the configured bcrypt cost factor.
 * @function hashPassword
 */
export const hashPassword = (plainPassword) =>
  bcrypt.hash(plainPassword, config.bcryptSaltRounds);

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * @function comparePassword
 */
export const comparePassword = (plainPassword, hashedPassword) =>
  bcrypt.compare(plainPassword, hashedPassword);
