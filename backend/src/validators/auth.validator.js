/**
 * @fileoverview express-validator chains for the authentication endpoints.
 *
 * @module validators/auth.validator
 */
import { body } from 'express-validator';

/**
 * Reusable password-strength rules shared by the register and reset flows.
 * @function passwordRules
 */
const passwordRules = (field = 'password') =>
  body(field)
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number');

/** Validation chain for POST /register. */
export const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required'),
  passwordRules(),
];

/** Validation chain for POST /login. */
export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/** Validation chain for POST /verify-email. */
export const verifyEmailValidator = [
  body('token').trim().notEmpty().withMessage('Verification token is required'),
];

/** Validation chain for POST /forgot-password. */
export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required'),
];

/** Validation chain for POST /reset-password. */
export const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  passwordRules(),
];

/** Validation chain for POST /google. */
export const googleAuthValidator = [
  body('idToken').trim().notEmpty().withMessage('Google ID token is required'),
];

/** Validation chain for PATCH /me. */
export const updateProfileValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
];

/** Validation chain for POST /set-password. */
export const setPasswordValidator = [
  passwordRules(),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

/** Validation chain for POST /change-password. */
export const changePasswordValidator = [
  // The stored password only has to be present: it may predate the current rules.
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  passwordRules('newPassword'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
];
