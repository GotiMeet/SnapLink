/**
 * @fileoverview Versioned short URL routes, mounted at /api/v1/urls.
 *
 * @module routes/url.routes
 */
import { Router } from 'express';

import * as urlController from '../controllers/url.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validateMiddleware from '../middleware/validate.middleware.js';
import {
  createUrlValidator,
  updateUrlValidator,
  listUrlsValidator,
  urlIdParamValidator,
  aliasParamValidator,
} from '../validators/url.validator.js';

const router = Router();

// Every short URL endpoint acts on the authenticated user's own data.
router.use(authMiddleware);

/**
 * Creates a short URL.
 * @name POST /api/v1/urls
 * @function
 * @memberof module:routes/url.routes
 */
router.post('/', createUrlValidator, validateMiddleware, urlController.createUrl);

/**
 * Lists the user's short URLs.
 * @name GET /api/v1/urls
 * @function
 * @memberof module:routes/url.routes
 */
router.get('/', listUrlsValidator, validateMiddleware, urlController.getUrls);

/**
 * Checks whether a custom alias is still available.
 * @name GET /api/v1/urls/alias-availability/:alias
 * @function
 * @memberof module:routes/url.routes
 */
router.get('/alias-availability/:alias', aliasParamValidator, validateMiddleware, urlController.checkAliasAvailability);

/**
 * Returns a single short URL.
 * @name GET /api/v1/urls/:urlId
 * @function
 * @memberof module:routes/url.routes
 */
router.get('/:urlId', urlIdParamValidator, validateMiddleware, urlController.getUrlById);

/**
 * Returns the QR code image for a short URL.
 * @name GET /api/v1/urls/:urlId/qr
 * @function
 * @memberof module:routes/url.routes
 */
router.get('/:urlId/qr', urlIdParamValidator, validateMiddleware, urlController.getUrlQrCode);

/**
 * Updates a short URL.
 * @name PATCH /api/v1/urls/:urlId
 * @function
 * @memberof module:routes/url.routes
 */
router.patch('/:urlId', urlIdParamValidator, updateUrlValidator, validateMiddleware, urlController.updateUrl);

/**
 * Soft-deletes a short URL.
 * @name DELETE /api/v1/urls/:urlId
 * @function
 * @memberof module:routes/url.routes
 */
router.delete('/:urlId', urlIdParamValidator, validateMiddleware, urlController.deleteUrl);

/**
 * Restores a soft-deleted short URL.
 * @name PATCH /api/v1/urls/:urlId/restore
 * @function
 * @memberof module:routes/url.routes
 */
router.patch('/:urlId/restore', urlIdParamValidator, validateMiddleware, urlController.restoreUrl);

export default router;
