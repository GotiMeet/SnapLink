/**
 * @fileoverview express-validator chains for the project endpoints.
 *
 * @module validators/project.validator
 */
import { body, param, query } from 'express-validator';

/** Validation chain for the :projectId route parameter. */
export const projectIdParamValidator = [
  param('projectId').isMongoId().withMessage('A valid project id is required'),
];

/** Validation chain for POST /projects. */
export const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ max: 100 })
    .withMessage('Project title cannot exceed 100 characters'),
];

/** Validation chain for PATCH /projects/:projectId. */
export const updateProjectValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ max: 100 })
    .withMessage('Project title cannot exceed 100 characters'),
];

/** Validation chain for GET /projects. */
export const listProjectsValidator = [
  query('deleted')
    .optional()
    .isBoolean()
    .withMessage('Deleted filter must be a boolean'),
];
