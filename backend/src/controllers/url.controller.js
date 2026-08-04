/**
 * @fileoverview HTTP controllers for short URL management.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Handlers stay thin and delegate to the URL service; they are only responsible
 * for reading the request and returning sanitized documents, so a link password
 * hash never reaches a response.
 *
 * @module controllers/url.controller
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { sanitizeShortUrl } from '../utils/sanitizeShortUrl.js';
import * as urlService from '../services/url.service.js';

/**
 * Creates a short URL inside one of the user's projects.
 * @function createUrl
 * @route POST /api/v1/urls
 * @access Private
 */
export const createUrl = asyncHandler(async (req, res) => {
  const {
    projectId,
    title,
    originalUrl,
    visibility,
    customAlias,
    password,
    scheduledLiveAt,
    scheduledDeleteAt,
  } = req.body;

  const shortUrl = await urlService.createUrl({
    ownerId: req.user._id,
    projectId,
    title,
    originalUrl,
    visibility,
    customAlias,
    password,
    scheduledLiveAt,
    scheduledDeleteAt,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Short URL created successfully',
    data: { shortUrl: sanitizeShortUrl(shortUrl) },
  });
});

/**
 * Lists the authenticated user's short URLs.
 * @function getUrls
 * @route GET /api/v1/urls
 * @access Private
 */
export const getUrls = asyncHandler(async (req, res) => {
  const shortUrls = await urlService.getUrls({
    ownerId: req.user._id,
    projectId: req.query.projectId,
    deleted: req.query.deleted === 'true',
  });

  return sendSuccess(res, {
    data: { shortUrls: shortUrls.map(sanitizeShortUrl) },
  });
});

/**
 * Reports whether a custom alias can still be claimed.
 * @function checkAliasAvailability
 * @route GET /api/v1/urls/alias-availability/:alias
 * @access Private
 */
export const checkAliasAvailability = asyncHandler(async (req, res) => {
  const { alias } = req.params;
  const available = await urlService.isShortCodeAvailable(alias);

  return sendSuccess(res, {
    message: available ? 'Alias is available' : 'Alias is already taken',
    data: { alias, available },
  });
});

/**
 * Returns a single short URL owned by the authenticated user.
 * @function getUrlById
 * @route GET /api/v1/urls/:urlId
 * @access Private
 */
export const getUrlById = asyncHandler(async (req, res) => {
  const shortUrl = await urlService.getUrlById({
    urlId: req.params.urlId,
    ownerId: req.user._id,
  });

  return sendSuccess(res, { data: { shortUrl: sanitizeShortUrl(shortUrl) } });
});

/**
 * Updates a short URL owned by the authenticated user.
 * @function updateUrl
 * @route PATCH /api/v1/urls/:urlId
 * @access Private
 */
export const updateUrl = asyncHandler(async (req, res) => {
  const { title, originalUrl, visibility, password, scheduledLiveAt, scheduledDeleteAt } =
    req.body;

  const shortUrl = await urlService.updateUrl({
    urlId: req.params.urlId,
    ownerId: req.user._id,
    title,
    originalUrl,
    visibility,
    password,
    scheduledLiveAt,
    scheduledDeleteAt,
  });

  return sendSuccess(res, {
    message: 'Short URL updated successfully',
    data: { shortUrl: sanitizeShortUrl(shortUrl) },
  });
});

/**
 * Soft-deletes a short URL owned by the authenticated user.
 * @function deleteUrl
 * @route DELETE /api/v1/urls/:urlId
 * @access Private
 */
export const deleteUrl = asyncHandler(async (req, res) => {
  const shortUrl = await urlService.softDeleteUrl({
    urlId: req.params.urlId,
    ownerId: req.user._id,
  });

  return sendSuccess(res, {
    message: 'Short URL moved to the recycle bin',
    data: { shortUrl: sanitizeShortUrl(shortUrl) },
  });
});

/**
 * Restores a soft-deleted short URL.
 * @function restoreUrl
 * @route PATCH /api/v1/urls/:urlId/restore
 * @access Private
 */
export const restoreUrl = asyncHandler(async (req, res) => {
  const { shortUrl, project } = await urlService.restoreUrl({
    urlId: req.params.urlId,
    ownerId: req.user._id,
  });

  // Reached only when the parent project is live; a link inside a deleted project
  // is refused by the service so it stays in the recycle bin.
  return sendSuccess(res, {
    message: 'Short URL restored successfully',
    data: { shortUrl: sanitizeShortUrl(shortUrl), project },
  });
});
