/**
 * @fileoverview Versioned authentication routes, mounted at /api/v1/auth.
 *
 * @module routes/auth.routes
 */
import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import validateMiddleware from '../middleware/validate.middleware.js';
import {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  googleAuthValidator,
  updateProfileValidator,
  setPasswordValidator,
  changePasswordValidator,
} from '../validators/auth.validator.js';

const router = Router();

/**
 * Registers a new local account.
 * @name POST /api/v1/auth/register
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/register', registerValidator, validateMiddleware, authController.register);

/**
 * Verifies a user's email address.
 * @name POST /api/v1/auth/verify-email
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/verify-email', verifyEmailValidator, validateMiddleware, authController.verifyEmail);

/**
 * Authenticates a user and starts a session.
 * @name POST /api/v1/auth/login
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/login', loginValidator, validateMiddleware, authController.login);

/**
 * Rotates the access/refresh token pair from the refresh cookie.
 * @name POST /api/v1/auth/refresh
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/refresh', authController.refresh);

/**
 * Ends the current session.
 * @name POST /api/v1/auth/logout
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/logout', authController.logout);

/**
 * Requests a password-reset email.
 * @name POST /api/v1/auth/forgot-password
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/forgot-password', forgotPasswordValidator, validateMiddleware, authController.forgotPassword);

/**
 * Resets the password using a reset token.
 * @name POST /api/v1/auth/reset-password
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/reset-password', resetPasswordValidator, validateMiddleware, authController.resetPassword);

/**
 * Authenticates or provisions a user via Google OAuth.
 * @name POST /api/v1/auth/google
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/google', googleAuthValidator, validateMiddleware, authController.googleAuth);

/**
 * Returns the currently authenticated user.
 * @name GET /api/v1/auth/me
 * @function
 * @memberof module:routes/auth.routes
 */
router.get('/me', authMiddleware, authController.me);

/**
 * Updates the authenticated user's profile.
 * @name PATCH /api/v1/auth/me
 * @function
 * @memberof module:routes/auth.routes
 */
router.patch('/me', authMiddleware, updateProfileValidator, validateMiddleware, authController.updateProfile);

/**
 * Gives an account without a password its first one.
 * @name POST /api/v1/auth/set-password
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/set-password', authMiddleware, setPasswordValidator, validateMiddleware, authController.setPassword);

/**
 * Replaces the authenticated user's existing password.
 * @name POST /api/v1/auth/change-password
 * @function
 * @memberof module:routes/auth.routes
 */
router.post('/change-password', authMiddleware, changePasswordValidator, validateMiddleware, authController.changePassword);

export default router;
