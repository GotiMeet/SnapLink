/**
 * @fileoverview HTTP controllers for link analytics reporting.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Each handler reads the link id and reporting window from the request and hands
 * them to the analytics service; ownership, the window rules, and every
 * aggregation stay in that service.
 *
 * @module controllers/analytics.controller
 */
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import * as analyticsService from '../services/analytics.service.js';

/**
 * Collects the reporting request shared by every endpoint below.
 * @function getReportRequest
 */
const getReportRequest = (req) => ({
  urlId: req.params.urlId,
  ownerId: req.user._id,
  from: req.query.from,
  to: req.query.to,
});

/**
 * Returns every report for a link in one payload.
 * @function getAnalytics
 * @route GET /api/v1/analytics/:urlId
 * @access Private
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getAnalytics(getReportRequest(req));

  return sendSuccess(res, { data: { analytics } });
});

/**
 * Returns the headline totals for a link.
 * @function getOverview
 * @route GET /api/v1/analytics/:urlId/overview
 * @access Private
 */
export const getOverview = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getOverview(getReportRequest(req));

  return sendSuccess(res, { data: { analytics } });
});

/**
 * Returns the day-by-day series for a link.
 * @function getTimeline
 * @route GET /api/v1/analytics/:urlId/timeline
 * @access Private
 */
export const getTimeline = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getTimeline(getReportRequest(req));

  return sendSuccess(res, { data: { analytics } });
});

/**
 * Returns the browser breakdown for a link.
 * @function getBrowsers
 * @route GET /api/v1/analytics/:urlId/browsers
 * @access Private
 */
export const getBrowsers = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getBrowsers(getReportRequest(req));

  return sendSuccess(res, { data: { analytics } });
});

/**
 * Returns the operating-system breakdown for a link.
 * @function getOperatingSystems
 * @route GET /api/v1/analytics/:urlId/os
 * @access Private
 */
export const getOperatingSystems = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getOperatingSystems(getReportRequest(req));

  return sendSuccess(res, { data: { analytics } });
});

/**
 * Returns the device breakdown for a link.
 * @function getDevices
 * @route GET /api/v1/analytics/:urlId/devices
 * @access Private
 */
export const getDevices = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getDevices(getReportRequest(req));

  return sendSuccess(res, { data: { analytics } });
});

/**
 * Returns the referrer breakdown for a link.
 * @function getReferrers
 * @route GET /api/v1/analytics/:urlId/referrers
 * @access Private
 */
export const getReferrers = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getReferrers(getReportRequest(req));

  return sendSuccess(res, { data: { analytics } });
});
