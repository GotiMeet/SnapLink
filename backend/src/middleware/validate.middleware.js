/**
 * @fileoverview Request-validation middleware.
 *
 * BUSINESS PURPOSE:
 * Collects the results of the express-validator chains attached to a route and,
 * when any check fails, short-circuits with a uniform 422 error payload so
 * controllers only ever run against validated input.
 *
 * @module middleware/validate.middleware
 */
import { validationResult } from 'express-validator';

import ApiError from '../utils/ApiError.js';

/**
 * Aggregates validation errors into a single 422 response, or passes control on.
 * @function validateMiddleware
 */
const validateMiddleware = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  throw new ApiError(422, 'Validation failed', errors);
};

export default validateMiddleware;
