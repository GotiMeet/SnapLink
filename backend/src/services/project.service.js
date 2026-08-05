/**
 * @fileoverview Project management service.
 *
 * BUSINESS PURPOSE:
 * Owns the project lifecycle — creation, retrieval, updates, soft delete, and
 * restore. Projects are the containers every short URL belongs to, so deleting
 * or restoring one propagates to its links and each operation is scoped to the
 * requesting owner.
 *
 * @module services/project.service
 */
import mongoose from 'mongoose';

import Project from '../models/project.model.js';
import ShortUrl from '../models/shortUrl.model.js';
import { URL_STATUS } from '../constants/status.js';
import ApiError from '../utils/ApiError.js';

const PROJECT_NOT_FOUND_MESSAGE = 'Project not found';
const TITLE_TAKEN_MESSAGE = 'A project with this title already exists';
const RESTORE_TITLE_TAKEN_MESSAGE =
  'Another project already uses this title, rename it before restoring this one';

/**
 * Maps a unique-index violation onto the conflict it represents, and leaves any
 * other failure untouched. The index is what makes the check race-safe.
 * @function toTitleConflict
 */
const toTitleConflict = (error, message = TITLE_TAKEN_MESSAGE) =>
  error?.code === 11000 ? new ApiError(409, message) : error;

/**
 * Loads a project that belongs to the given owner, or throws.
 * A 404 (rather than 403) is used so the API never reveals that another user
 * owns the requested id.
 * @function findOwnedProject
 */
const findOwnedProject = async ({ projectId, ownerId, deleted = false, session = null }) => {
  const query = Project.findOne({
    _id: projectId,
    owner: ownerId,
    deletedAt: deleted ? { $ne: null } : null,
  });

  if (session) {
    query.session(session);
  }

  const project = await query;

  if (!project) {
    throw new ApiError(404, PROJECT_NOT_FOUND_MESSAGE);
  }

  return project;
};

/**
 * Runs a project lifecycle change and its link propagation as one transaction,
 * so the project and its links can never end up in disagreeing states.
 * @function runProjectLifecycleChange
 */
const runProjectLifecycleChange = async ({ projectId, ownerId, deleted, apply }) => {
  const session = await mongoose.startSession();

  try {
    let project;

    await session.withTransaction(async () => {
      project = await findOwnedProject({ projectId, ownerId, deleted, session });
      await apply(project, session);
    });

    return project;
  } finally {
    await session.endSession();
  }
};

/**
 * Ensures a project exists and belongs to the owner before URLs are attached to it.
 * @function assertProjectOwned
 */
export const assertProjectOwned = ({ projectId, ownerId }) =>
  findOwnedProject({ projectId, ownerId });

/**
 * Returns the identifying fields of a project plus its deleted state.
 * Used when a response has to tell the client where a link's project stands.
 * @function getProjectSummary
 */
export const getProjectSummary = (projectId) =>
  Project.findById(projectId).select('title deletedAt');

/**
 * Confirms inside a transaction that a project is still live and owned, and
 * returns it, or null when it is missing, not owned, or already deleted.
 *
 * The update writes back the value the filter just matched, so no field changes,
 * but this transaction becomes a writer of the project document. A concurrent
 * softDeleteProject writes that same document, so MongoDB fails one of the two
 * with a write conflict instead of letting a link go live inside a project that
 * is being deleted. A plain re-read could not catch that: under snapshot
 * isolation it would still see the project as live.
 * @function claimActiveProject
 */
export const claimActiveProject = ({ projectId, ownerId, session }) =>
  Project.findOneAndUpdate(
    { _id: projectId, owner: ownerId, deletedAt: null },
    { $set: { deletedAt: null } },
    { session, timestamps: false, new: true }
  );

/**
 * Creates a project for the owner. Titles are unique among that owner's live
 * projects.
 * @function createProject
 */
export const createProject = async ({ ownerId, title }) => {
  try {
    return await Project.create({ owner: ownerId, title });
  } catch (error) {
    throw toTitleConflict(error);
  }
};

/**
 * Lists the owner's active projects, or their soft-deleted ones,
 * most recently updated first.
 * @function getProjects
 */
export const getProjects = ({ ownerId, deleted = false }) =>
  Project.find({
    owner: ownerId,
    deletedAt: deleted ? { $ne: null } : null,
  }).sort({ updatedAt: -1 });

/**
 * Returns a single active project owned by the requester.
 * @function getProjectById
 */
export const getProjectById = ({ projectId, ownerId }) =>
  findOwnedProject({ projectId, ownerId });

/**
 * Updates an active project's editable fields.
 * @function updateProject
 */
export const updateProject = async ({ projectId, ownerId, title }) => {
  const project = await findOwnedProject({ projectId, ownerId });

  if (title !== undefined) {
    project.title = title;
  }

  try {
    await project.save();
  } catch (error) {
    throw toTitleConflict(error);
  }

  return project;
};

/**
 * Soft-deletes a project and takes its active links offline with it.
 * Links the owner had already deleted are left untouched so their own state
 * survives a later restore.
 * @function softDeleteProject
 */
export const softDeleteProject = ({ projectId, ownerId }) =>
  runProjectLifecycleChange({
    projectId,
    ownerId,
    deleted: false,
    apply: async (project, session) => {
      project.deletedAt = new Date();
      await project.save({ session });

      await ShortUrl.updateMany(
        { project: project._id, status: URL_STATUS.ACTIVE },
        { $set: { status: URL_STATUS.DELETED_PROJECT } },
        { session }
      );
    },
  });

/**
 * Restores a soft-deleted project and only the links it had taken offline.
 * @function restoreProject
 */
export const restoreProject = ({ projectId, ownerId }) =>
  runProjectLifecycleChange({
    projectId,
    ownerId,
    deleted: true,
    apply: async (project, session) => {
      project.deletedAt = null;

      // The title was free while this project sat deleted; another may hold it now.
      try {
        await project.save({ session });
      } catch (error) {
        throw toTitleConflict(error, RESTORE_TITLE_TAKEN_MESSAGE);
      }

      await ShortUrl.updateMany(
        { project: project._id, status: URL_STATUS.DELETED_PROJECT },
        { $set: { status: URL_STATUS.ACTIVE } },
        { session }
      );
    },
  });
