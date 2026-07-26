/**
 * @fileoverview Application error type.
 *
 * BUSINESS PURPOSE:
 * A typed error carrying an HTTP status code and optional field-level details so
 * the global error handler can produce consistent, well-formed error responses.
 *
 * @module utils/ApiError
 */

/**
 * HTTP-aware error with a status code and optional error details.
 * @class ApiError
 */
class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
