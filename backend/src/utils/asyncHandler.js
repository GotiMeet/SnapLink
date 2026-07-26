/**
 * @fileoverview Async route-handler wrapper.
 *
 * BUSINESS PURPOSE:
 * Wraps async handlers so rejected promises are forwarded to Express's error
 * handler instead of surfacing as unhandled rejections, removing repetitive
 * try/catch from every controller.
 *
 * @module utils/asyncHandler
 */

/**
 * Wraps an async request handler and routes any rejection to next().
 * @function asyncHandler
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export default asyncHandler;
