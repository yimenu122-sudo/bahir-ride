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
 * @desc    Standard Login Flow:
 *          1. Check user exists
 *          2. Check users.status === 'ACTIVE'
 *          3. Check user_verifications.verified === true
 *          4. Verify password
 *          5. Generate JWT token
 *          6. Login success
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


/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset OTP via email
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.body;
    const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';

    await authService.requestPasswordResetOTP(identifier);

    // Always return success to prevent enumeration
    const message = lang === 'am' 
      ? 'የይለፍ ቃል መቀየርያ ኮድ ወደ ኢሜይልዎ ተልኳል' 
      : 'If an account exists, a reset code has been sent to your email';

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using OTP
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';

    await authService.resetPassword(data);

    const message = lang === 'am' 
      ? 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል' 
      : 'Password reset successfully';

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};


/**
 * @route   POST /api/v1/auth/verify-reset-otp
 * @desc    Verify password reset OTP (Peek only)
 */
export const verifyResetOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, otp } = req.body;
    // Note: client might send 'phoneNumber' but it could be email identifier.
    // authService.verifyResetCode handles identifier (phone/email).
    
    await authService.verifyResetCode(phoneNumber, otp);

    res.status(200).json({
      success: true,
      message: 'Code verified'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend OTP for registration or password reset
 */
export const resendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, type } = req.body;
    const lang = req.headers['accept-language']?.startsWith('am') ? 'am' : 'en';

    await authService.resendOTP(identifier, type);

    const message = lang === 'am' 
      ? 'የማረጋገጫ ኮድ በድጋሚ ተልኳል' 
      : 'Verification code resent successfully';

    res.status(200).json({
      success: true,
      message
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
  login,
  forgotPassword,
  resetPassword,
  verifyResetOTP,
  resendOTP
};

