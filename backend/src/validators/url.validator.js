/**
 * @fileoverview express-validator chains for the short URL endpoints.
 *
 * @module validators/url.validator
 */
import { body, param, query } from 'express-validator';

import { VISIBILITY } from '../constants/visibility.js';
import {
  ALIAS_MAX_LENGTH,
  ALIAS_MIN_LENGTH,
  ALIAS_PATTERN,
  RESERVED_SHORT_CODES,
} from '../constants/shortCode.js';

/**
 * Applies the shared alias format rules to an existing chain.
 * @function aliasRules
 */
const aliasRules = (chain) =>
  chain
    .isLength({ min: ALIAS_MIN_LENGTH, max: ALIAS_MAX_LENGTH })
    .withMessage(
      `Alias must be between ${ALIAS_MIN_LENGTH} and ${ALIAS_MAX_LENGTH} characters`
    )
    .matches(ALIAS_PATTERN)
    .withMessage(
      'Alias may only contain letters, numbers, hyphens, and underscores'
    )
    .custom((value) => {
      if (RESERVED_SHORT_CODES.includes(value.toLowerCase())) {
        throw new Error('This alias is reserved');
      }

      return true;
    });

/**
 * Reusable link-password rules shared by the create and update flows.
 * @function linkPasswordRules
 */
const linkPasswordRules = (chain) =>
  chain
    .isString()
    .withMessage('Password is required for private links')
    // Stops the chain when no string arrived, so the blank check below is safe.
    .bail()
    .custom((value) => {
      if (!value.trim()) {
        throw new Error('Password cannot be empty or only whitespace');
      }

      return true;
    })
    .isLength({ min: 6, max: 72 })
    .withMessage('Password must be between 6 and 72 characters');

/**
 * Applies the shared scheduling-date rules to an existing chain.
 * The dates are only stored for now, so they are checked for format alone.
 * @function scheduleRules
 */
const scheduleRules = (chain, label) =>
  chain.isISO8601().withMessage(`${label} must be a valid ISO 8601 date`);

/** Validation chain for the :urlId route parameter. */
export const urlIdParamValidator = [
  param('urlId').isMongoId().withMessage('A valid short URL id is required'),
];

/** Validation chain for GET /urls/alias-availability/:alias. */
export const aliasParamValidator = [aliasRules(param('alias').trim())];

/** Validation chain for POST /urls. */
export const createUrlValidator = [
  body('projectId').isMongoId().withMessage('A valid project id is required'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('originalUrl')
    .trim()
    .notEmpty()
    .withMessage('Original URL is required')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('A valid http or https URL is required')
    .isLength({ max: 2048 })
    .withMessage('Original URL cannot exceed 2048 characters'),
  body('visibility')
    .optional()
    .isIn(Object.values(VISIBILITY))
    .withMessage('Visibility must be either public or private'),
  // An empty alias is treated as absent so the caller receives a generated code.
  aliasRules(body('customAlias').optional({ values: 'falsy' }).trim()),
  linkPasswordRules(
    body('password').if(body('visibility').equals(VISIBILITY.PRIVATE))
  ),
  body('password')
    .if(body('visibility').not().equals(VISIBILITY.PRIVATE))
    .not()
    .exists()
    .withMessage('A password can only be set on a private link'),
  body('confirmPassword')
    .if(body('password').exists())
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  scheduleRules(
    body('scheduledLiveAt').optional({ values: 'falsy' }),
    'Scheduled live date'
  ),
  scheduleRules(
    body('scheduledDeleteAt').optional({ values: 'falsy' }),
    'Scheduled delete date'
  ),
];

/** Validation chain for PATCH /urls/:urlId. */
export const updateUrlValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters'),
  body('originalUrl')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Original URL is required')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('A valid http or https URL is required')
    .isLength({ max: 2048 })
    .withMessage('Original URL cannot exceed 2048 characters'),
  body('visibility')
    .optional()
    .isIn(Object.values(VISIBILITY))
    .withMessage('Visibility must be either public or private'),
  // Only an absent password skips the rules: an empty one is a mistake, not a clear.
  linkPasswordRules(body('password').optional()),
  body('confirmPassword')
    .if(body('password').exists({ values: 'falsy' }))
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  scheduleRules(
    body('scheduledLiveAt').optional({ values: 'null' }),
    'Scheduled live date'
  ),
  scheduleRules(
    body('scheduledDeleteAt').optional({ values: 'null' }),
    'Scheduled delete date'
  ),
];

/** Validation chain for GET /urls. */
export const listUrlsValidator = [
  query('projectId')
    .optional()
    .isMongoId()
    .withMessage('A valid project id is required'),
  query('deleted')
    .optional()
    .isBoolean()
    .withMessage('Deleted filter must be a boolean'),
];

/** Validation chain for POST /:shortCode (unlocking a protected link). */
export const unlockShortLinkValidator = [
  body('password').isString().notEmpty().withMessage('Password is required'),
];
