/**
 * @fileoverview Root API router that composes the versioned route modules.
 *
 * @module routes/index
 */
import { Router } from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import urlRoutes from './url.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/urls', urlRoutes);

export default router;
