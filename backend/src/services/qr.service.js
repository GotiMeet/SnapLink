/**
 * @fileoverview QR code generation service.
 *
 * BUSINESS PURPOSE:
 * Renders the scannable image for a short link. The encoded address carries the
 * QR source marker, so the redirect that already reads it counts a scan as a QR
 * scan rather than an ordinary click.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Nothing is persisted here. The image is produced per request, so there is no
 * stored copy to regenerate, invalidate, or fall out of step with the link.
 *
 * @module services/qr.service
 */
import QRCode from 'qrcode';

import config from '../config/env.js';
import { VISIT_SOURCE } from '../constants/analytics.js';

/**
 * Builds the address a scan should open, tagged as QR traffic.
 * The marker comes from the same constant the redirect compares against, so the
 * two cannot drift apart.
 * @function buildQrTargetUrl
 */
export const buildQrTargetUrl = (shortCode) =>
  `${config.appUrl}/${shortCode}?src=${VISIT_SOURCE.QR}`;

/**
 * Renders a short code as a PNG QR code using the library defaults:
 * black on white, default error correction, no branding.
 * @function generateQrPng
 */
export const generateQrPng = (shortCode) =>
  QRCode.toBuffer(buildQrTargetUrl(shortCode), { type: 'png' });
