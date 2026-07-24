import config from '../config/env.js';
import { sendError } from '../utils/ApiResponse.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  const errors = err.errors || [];

  if (statusCode >= 500 || config.nodeEnv === 'development') {
    console.error(err);
  }

  return sendError(res, { statusCode, message, errors });
};

export default errorHandler;
