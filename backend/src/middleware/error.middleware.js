/**
 * @fileoverview Global error-handling middleware.
 *
 * BUSINESS PURPOSE:
 * The single place that converts thrown or forwarded errors into the standardized
 * error response, so failures across the app look consistent to clients.
 *
 * @module middleware/error.middleware
 */
import config from '../config/env.js';
import { sendError } from '../utils/ApiResponse.js';

/**
 * Normalizes any error into a standardized JSON response.
 * The four-argument signature is required for Express to treat this as an error handler.
 * @function errorMiddleware
 */
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  const errors = err.errors || [];

  // Log server faults always, and everything in development, to aid debugging.
  if (statusCode >= 500 || config.nodeEnv === 'development') {
    console.error(err);
  }

  return sendError(res, { statusCode, message, errors });
};

export default errorMiddleware;
