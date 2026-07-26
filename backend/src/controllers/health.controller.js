/**
 * @fileoverview Health-check controller.
 *
 * @module controllers/health.controller
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';

/**
 * Returns a simple liveness message confirming the backend is running.
 * @function healthCheck
 * @route GET /api/v1/health
 * @access Public
 */
const healthCheck = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: 'SnapLink Backend is running',
  });
});

export { healthCheck };
