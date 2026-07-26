/**
 * @fileoverview Transactional email service.
 *
 * BUSINESS PURPOSE:
 * Delivers the emails the authentication flows depend on — account verification
 * and password-reset links. The SMTP transport is created lazily so the app can
 * run in development without mail configuration.
 *
 * @module services/email.service
 */
import nodemailer from 'nodemailer';

import config from '../config/env.js';
import ApiError from '../utils/ApiError.js';

let transporter = null;

/**
 * Lazily builds (and caches) the SMTP transport, or null when unconfigured.
 * @function getTransporter
 */
const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!config.email.host) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
};

/**
 * Sends an email, failing loudly in production but degrading gracefully in dev.
 * @function deliver
 */
const deliver = async ({ to, subject, html }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    // Without SMTP: fail in production, but log locally so dev flows still work.
    if (config.nodeEnv === 'production') {
      throw new ApiError(500, 'Email service is not configured');
    }
    console.warn(
      `[email] SMTP not configured; email to ${to} was not sent.\nSubject: ${subject}\n${html}`
    );
    return;
  }

  await activeTransporter.sendMail({ from: config.email.from, to, subject, html });
};

/**
 * Sends the account email-verification link.
 * @function sendVerificationEmail
 */
export const sendVerificationEmail = (user, token) => {
  const url = `${config.clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return deliver({
    to: user.email,
    subject: 'Verify your SnapLink email',
    html: `<p>Hello ${user.fullName},</p><p>Please verify your email by opening the link below:</p><p><a href="${url}">Verify email</a></p>`,
  });
};

/**
 * Sends the password-reset link.
 * @function sendPasswordResetEmail
 */
export const sendPasswordResetEmail = (user, token) => {
  const url = `${config.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return deliver({
    to: user.email,
    subject: 'Reset your SnapLink password',
    html: `<p>Hello ${user.fullName},</p><p>You can reset your password using the link below. It expires shortly.</p><p><a href="${url}">Reset password</a></p>`,
  });
};
