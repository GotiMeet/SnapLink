/**
 * @fileoverview 404 (route-not-found) middleware.
 *
 * @module middleware/notFound.middleware
 */
import ApiError from '../utils/ApiError.js';

/**
 * Converts an unmatched route into a 404 ApiError for the global error handler.
 * @function notFoundMiddleware
 */
const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFoundMiddleware;
