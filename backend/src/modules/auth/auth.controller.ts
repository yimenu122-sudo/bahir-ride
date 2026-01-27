import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

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
export const requestOTP = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and return access/refresh tokens
 */
export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get new access token using a valid refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';

    const result = await authService.refreshTokens(refreshToken);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate refresh token
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body; // or from user context
    const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';

    await authService.logout(refreshToken);

    const message = lang === 'am' ? 'በተሳካ ሁኔታ ወጥተዋል' : 'Logged out successfully';

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 */
export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const user = await authService.getCurrentUser(userId, userRole);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Initiate registration (Cache data + Send OTP)
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';

    await authService.registerUsingOTP(data);

    const message = lang === 'am' 
      ? 'የማረጋገጫ ኮድ ወደ ስልክዎ ተልኳል' 
      : 'Verification code has been sent to your phone';

    res.status(200).json({
      success: true,
      message,
      data: { phoneNumber: data.phone }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Standard login with phone/email and password
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';

    const result = await authService.login(identifier, password);

    const message = lang === 'am' ? 'በተሳካ ሁኔታ ገብተዋል' : 'Login successful';

    res.status(200).json({
      success: true,
      message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export default {
  requestOTP,
  register,
  verifyOTP,
  refreshToken,
  logout,
  getMe,
  login
};
