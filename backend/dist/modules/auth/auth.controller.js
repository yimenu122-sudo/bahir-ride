"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refreshToken = exports.verifyOTP = exports.requestOTP = void 0;
const authService = __importStar(require("./auth.service"));
/**
 * Auth Controller
 *
 * Handles HTTP requests for authentication.
 * Responsibilities:
 * - Parsing request body
 * - Calling business logic (Service)
 * - Sending standardized responses
 * - Handling language-based messaging
 */
/**
 * @route   POST /api/v1/auth/request-otp
 * @desc    Initiate authentication by sending an OTP to the phone number
 */
const requestOTP = async (req, res, next) => {
    try {
        const { phoneNumber, role } = req.body;
        const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';
        await authService.requestOTP(phoneNumber, role);
        const message = lang === 'am'
            ? 'የማረጋገጫ ኮድ ወደ ስልክዎ ተልኳል'
            : 'Verification code has been sent to your phone';
        res.status(200).json({
            success: true,
            message,
            data: { phoneNumber }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.requestOTP = requestOTP;
/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and return access/refresh tokens
 */
const verifyOTP = async (req, res, next) => {
    try {
        const { phoneNumber, otp } = req.body;
        const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';
        const result = await authService.verifyOTP(phoneNumber, otp);
        const message = lang === 'am' ? 'በተሳካ ሁኔታ ገብተዋል' : 'Login successful';
        res.status(200).json({
            success: true,
            message,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyOTP = verifyOTP;
/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get new access token using a valid refresh token
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';
        const result = await authService.refreshTokens(refreshToken);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate refresh token
 */
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body; // or from user context
        const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';
        await authService.logout(refreshToken);
        const message = lang === 'am' ? 'በተሳካ ሁኔታ ወጥተዋል' : 'Logged out successfully';
        res.status(200).json({
            success: true,
            message
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const user = await authService.getCurrentUser(userId, userRole);
        res.status(200).json({
            success: true,
            data: user
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
exports.default = {
    requestOTP: exports.requestOTP,
    verifyOTP: exports.verifyOTP,
    refreshToken: exports.refreshToken,
    logout: exports.logout,
    getMe: exports.getMe
};
