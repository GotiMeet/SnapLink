/**
 * @fileoverview Versioned analytics routes, mounted at /api/v1/analytics.
 *
 * @module routes/analytics.routes
 */
import { Router } from 'express';

import * as analyticsController from '../controllers/analytics.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validateMiddleware from '../middleware/validate.middleware.js';
import { analyticsReportValidator } from '../validators/analytics.validator.js';

const router = Router();

// Analytics only ever describe links the authenticated user owns.
router.use(authMiddleware);

/**
 * Returns every report for a link.
 * @name GET /api/v1/analytics/:urlId
 * @function
 * @memberof module:routes/analytics.routes
 */
router.get('/:urlId', analyticsReportValidator, validateMiddleware, analyticsController.getAnalytics);

/**
 * Returns the headline totals for a link.
 * @name GET /api/v1/analytics/:urlId/overview
 * @function
 * @memberof module:routes/analytics.routes
 */
router.get('/:urlId/overview', analyticsReportValidator, validateMiddleware, analyticsController.getOverview);

/**
 * Returns the day-by-day series for a link.
 * @name GET /api/v1/analytics/:urlId/timeline
 * @function
 * @memberof module:routes/analytics.routes
 */
router.get('/:urlId/timeline', analyticsReportValidator, validateMiddleware, analyticsController.getTimeline);

/**
 * Returns the browser breakdown for a link.
 * @name GET /api/v1/analytics/:urlId/browsers
 * @function
 * @memberof module:routes/analytics.routes
 */
router.get('/:urlId/browsers', analyticsReportValidator, validateMiddleware, analyticsController.getBrowsers);

/**
 * Returns the operating-system breakdown for a link.
 * @name GET /api/v1/analytics/:urlId/os
 * @function
 * @memberof module:routes/analytics.routes
 */
router.get('/:urlId/os', analyticsReportValidator, validateMiddleware, analyticsController.getOperatingSystems);

/**
 * Returns the device breakdown for a link.
 * @name GET /api/v1/analytics/:urlId/devices
 * @function
 * @memberof module:routes/analytics.routes
 */
router.get('/:urlId/devices', analyticsReportValidator, validateMiddleware, analyticsController.getDevices);

/**
 * Returns the referrer breakdown for a link.
 * @name GET /api/v1/analytics/:urlId/referrers
 * @function
 * @memberof module:routes/analytics.routes
 */
router.get('/:urlId/referrers', analyticsReportValidator, validateMiddleware, analyticsController.getReferrers);

export default router;
