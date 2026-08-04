/**
 * @fileoverview Versioned project routes, mounted at /api/v1/projects.
 *
 * @module routes/project.routes
 */
import { Router } from 'express';

import * as projectController from '../controllers/project.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validateMiddleware from '../middleware/validate.middleware.js';
import {
  createProjectValidator,
  updateProjectValidator,
  listProjectsValidator,
  projectIdParamValidator,
} from '../validators/project.validator.js';

const router = Router();

// Every project endpoint acts on the authenticated user's own data.
router.use(authMiddleware);

/**
 * Creates a project.
 * @name POST /api/v1/projects
 * @function
 * @memberof module:routes/project.routes
 */
router.post('/', createProjectValidator, validateMiddleware, projectController.createProject);

/**
 * Lists the user's projects.
 * @name GET /api/v1/projects
 * @function
 * @memberof module:routes/project.routes
 */
router.get('/', listProjectsValidator, validateMiddleware, projectController.getProjects);

/**
 * Returns a single project.
 * @name GET /api/v1/projects/:projectId
 * @function
 * @memberof module:routes/project.routes
 */
router.get('/:projectId', projectIdParamValidator, validateMiddleware, projectController.getProjectById);

/**
 * Updates a project.
 * @name PATCH /api/v1/projects/:projectId
 * @function
 * @memberof module:routes/project.routes
 */
router.patch('/:projectId', projectIdParamValidator, updateProjectValidator, validateMiddleware, projectController.updateProject);

/**
 * Soft-deletes a project.
 * @name DELETE /api/v1/projects/:projectId
 * @function
 * @memberof module:routes/project.routes
 */
router.delete('/:projectId', projectIdParamValidator, validateMiddleware, projectController.deleteProject);

/**
 * Restores a soft-deleted project.
 * @name PATCH /api/v1/projects/:projectId/restore
 * @function
 * @memberof module:routes/project.routes
 */
router.patch('/:projectId/restore', projectIdParamValidator, validateMiddleware, projectController.restoreProject);

export default router;
