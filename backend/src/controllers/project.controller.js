/**
 * @fileoverview HTTP controllers for project management.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Each handler reads the request, delegates to the project service, and formats
 * the standardized response; ownership and lifecycle rules stay in the service.
 *
 * @module controllers/project.controller
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as projectService from '../services/project.service.js';

/**
 * Creates a project for the authenticated user.
 * @function createProject
 * @route POST /api/v1/projects
 * @access Private
 */
export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject({
    ownerId: req.user._id,
    title: req.body.title,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Project created successfully',
    data: { project },
  });
});

/**
 * Lists the authenticated user's projects.
 * @function getProjects
 * @route GET /api/v1/projects
 * @access Private
 */
export const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects({
    ownerId: req.user._id,
    deleted: req.query.deleted === 'true',
  });

  return sendSuccess(res, { data: { projects } });
});

/**
 * Returns a single project owned by the authenticated user.
 * @function getProjectById
 * @route GET /api/v1/projects/:projectId
 * @access Private
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById({
    projectId: req.params.projectId,
    ownerId: req.user._id,
  });

  return sendSuccess(res, { data: { project } });
});

/**
 * Updates a project owned by the authenticated user.
 * @function updateProject
 * @route PATCH /api/v1/projects/:projectId
 * @access Private
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject({
    projectId: req.params.projectId,
    ownerId: req.user._id,
    title: req.body.title,
  });

  return sendSuccess(res, {
    message: 'Project updated successfully',
    data: { project },
  });
});

/**
 * Soft-deletes a project owned by the authenticated user.
 * @function deleteProject
 * @route DELETE /api/v1/projects/:projectId
 * @access Private
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectService.softDeleteProject({
    projectId: req.params.projectId,
    ownerId: req.user._id,
  });

  return sendSuccess(res, {
    message: 'Project moved to the recycle bin',
    data: { project },
  });
});

/**
 * Restores a soft-deleted project.
 * @function restoreProject
 * @route PATCH /api/v1/projects/:projectId/restore
 * @access Private
 */
export const restoreProject = asyncHandler(async (req, res) => {
  const project = await projectService.restoreProject({
    projectId: req.params.projectId,
    ownerId: req.user._id,
  });

  return sendSuccess(res, {
    message: 'Project restored successfully',
    data: { project },
  });
});
