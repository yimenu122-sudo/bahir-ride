"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const auth_validation_1 = require("./auth.validation");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
/**
 * Auth Routes
 * Prefix: /api/v1/auth
 */
const router = (0, express_1.Router)();
// --- Public Routes ---
// Request OTP (Login/Register)
router.post('/login', (0, auth_validation_1.validate)(auth_validation_1.requestOtpSchema), auth_controller_1.default.requestOTP);
// Verify OTP
router.post('/verify', (0, auth_validation_1.validate)(auth_validation_1.verifyOtpSchema), auth_controller_1.default.verifyOTP);
// Refresh Token
router.post('/refresh', (0, auth_validation_1.validate)(auth_validation_1.refreshTokenSchema), auth_controller_1.default.refreshToken);
// --- Protected Routes ---
// Logout
router.post('/logout', auth_middleware_1.protect, // Ensure user is logged in to logout (optional, but good practice for tracking)
auth_controller_1.default.logout);
// Get Current User Profile
router.get('/me', auth_middleware_1.protect, auth_controller_1.default.getMe);
exports.default = router;
