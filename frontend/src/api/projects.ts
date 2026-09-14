/**
 * Project endpoints.
 *
 * The model has exactly three fields — owner, title, deletedAt — plus
 * timestamps. There is no description, colour, icon, or link count on it;
 * everything a project card shows beyond its title is derived client-side from
 * GET /urls (PROJECT_MASTER.md section 4).
 */

import { request } from '@/lib/api';
import type { Project } from '@/types/models';

export const listProjects = (deleted = false) =>
  request<{ projects: Project[] }>('/projects', { params: { deleted } }).then(
    (data) => data.projects
  );

export const getProject = (projectId: string) =>
  request<{ project: Project }>(`/projects/${projectId}`).then((data) => data.project);

export const createProject = (title: string) =>
  request<{ project: Project }>('/projects', { method: 'POST', body: { title } }).then(
    (data) => data.project
  );

export const renameProject = ({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) =>
  request<{ project: Project }>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: { title },
  }).then((data) => data.project);

/**
 * Soft delete. The backend runs this in a transaction that also takes every
 * active or scheduled link in the project offline as `deleted_project`, so the
 * UI must describe it as a cascade rather than a single-object action.
 */
export const deleteProject = (projectId: string) =>
  request<{ project: Project }>(`/projects/${projectId}`, { method: 'DELETE' }).then(
    (data) => data.project
  );

/**
 * Restores a soft-deleted project, bringing back the links it had taken offline
 * in the same transaction.
 *
 * Refused with a 409 when an *active* project has claimed the title while this
 * one sat deleted. A soft-deleted project cannot be renamed, so the conflicting
 * active project is the one the owner has to rename.
 */
export const restoreProject = (projectId: string) =>
  request<{ project: Project }>(`/projects/${projectId}/restore`, {
    method: 'PATCH',
  }).then((data) => data.project);
