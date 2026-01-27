import { Router } from 'express';
import authController from './auth.controller';
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema, registerSchema, loginSchema, validate } from './auth.validation';
import { protect } from '../../middlewares/auth.middleware';

/**
 * Auth Routes
 * Prefix: /api/v1/auth
 */
const router = Router();

// --- Public Routes ---

// Register
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

// Login
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

// Request OTP
router.post(
  '/request-otp',
  validate(requestOtpSchema),
  authController.requestOTP
);

// Verify OTP
router.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  authController.verifyOTP
);

// Refresh Token
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

// --- Protected Routes ---

// Logout
router.post(
  '/logout',
  protect, // Ensure user is logged in to logout (optional, but good practice for tracking)
  authController.logout
);

// Get Current User Profile
router.get(
  '/me',
  protect,
  authController.getMe
);

export default router;
