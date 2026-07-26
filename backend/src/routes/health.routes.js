/**
 * @fileoverview Health-check route.
 *
 * @module routes/health.routes
 */
import { Router } from 'express';

import { healthCheck } from '../controllers/health.controller.js';

const router = Router();

/**
 * Reports that the API is running.
 * @name GET /api/v1/health
 * @function
 * @memberof module:routes/health.routes
 */
router.get('/', healthCheck);

export default router;
