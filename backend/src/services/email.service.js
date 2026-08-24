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
 * Communicates key policy details: 15-minute link expiry, link supersession
 * on resend, 1-hour unverified-account lifetime, and a safe-to-ignore notice.
 * @function sendVerificationEmail
 */
export const sendVerificationEmail = (user, token) => {
  const url = `${config.clientUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return deliver({
    to: user.email,
    subject: 'Verify your SnapLink email address',
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
  <div style="background:#6366f1;padding:32px 40px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:24px;color:#ffffff;letter-spacing:-0.5px">Verify your email address</h1>
  </div>
  <div style="background:#ffffff;padding:32px 40px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p style="margin:0 0 16px">Hello ${user.fullName},</p>
    <p style="margin:0 0 24px;color:#374151">
      Thank you for creating a SnapLink account. Click the button below to verify your email address and activate your account.
    </p>
    <div style="text-align:center;margin:0 0 28px">
      <a href="${url}"
         style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:6px">
        Verify email address
      </a>
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px 20px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-weight:600;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px">
        Important to know
      </p>
      <ul style="margin:0;padding:0 0 0 18px;color:#4b5563;font-size:14px;line-height:1.7">
        <li>This link is valid for <strong>15 minutes</strong>.</li>
        <li>Requesting a new verification email will <strong>invalidate this link</strong> immediately.</li>
        <li>Unverified accounts are <strong>automatically removed after 1 hour</strong>.</li>
      </ul>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280">
      If you did not create a SnapLink account, you can safely ignore this email — no action is needed and no account will be activated without verification.
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
      SnapLink &mdash; If the button above does not work, copy and paste the following link into your browser:<br>
      <span style="color:#6366f1;word-break:break-all">${url}</span>
    </p>
  </div>
</div>`,
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
