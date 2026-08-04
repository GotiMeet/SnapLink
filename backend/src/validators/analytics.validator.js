/**
 * @fileoverview express-validator chains for the analytics endpoints.
 *
 * @module validators/analytics.validator
 */
import { param, query } from 'express-validator';

/** Validation chain shared by every analytics endpoint. */
export const analyticsReportValidator = [
  param('urlId').isMongoId().withMessage('A valid short URL id is required'),
  query('from')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Range start must be a valid ISO 8601 date'),
  query('to')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Range end must be a valid ISO 8601 date'),
];
