/**
 * @fileoverview Standardized success/error response helpers.
 *
 * BUSINESS PURPOSE:
 * Guarantees every endpoint returns the same response envelope, keeping the API
 * predictable and consistent for clients.
 *
 * @module utils/ApiResponse
 */

/**
 * Sends a standardized success response.
 * @function sendSuccess
 */
const sendSuccess = (
  res,
  { statusCode = 200, message = 'Success', data = {} } = {}
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends a standardized error response.
 * @function sendError
 */
const sendError = (
  res,
  { statusCode = 500, message = 'Something went wrong', errors = [] } = {}
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export { sendSuccess, sendError };
