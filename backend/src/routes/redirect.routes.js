/**
 * @fileoverview Public short link routes, mounted at the application root.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Short links must resolve from the bare domain, so these routes sit outside the
 * versioned API and are registered after it to avoid shadowing any endpoint.
 *
 * @module routes/redirect.routes
 */
import { Router } from 'express';

import * as redirectController from '../controllers/redirect.controller.js';
import validateMiddleware from '../middleware/validate.middleware.js';
import { unlockShortLinkValidator } from '../validators/url.validator.js';

const router = Router();

/**
 * Redirects a visitor to the destination behind a short code.
 * @name GET /:shortCode
 * @function
 * @memberof module:routes/redirect.routes
 */
router.get('/:shortCode', redirectController.redirectToOriginalUrl);

/**
 * Unlocks a password-protected short link and returns its destination.
 * @name POST /:shortCode
 * @function
 * @memberof module:routes/redirect.routes
 */
router.post('/:shortCode', unlockShortLinkValidator, validateMiddleware, redirectController.unlockShortLink);

export default router;
