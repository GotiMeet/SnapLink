import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';

const healthCheck = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: 'SnapLink Backend is running',
  });
});

export { healthCheck };
