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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.logout = exports.refreshTokens = exports.verifyOTP = exports.requestOTP = exports.AuthServiceError = exports.AuthErrors = void 0;
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../../config/database"));
const redis_1 = __importStar(require("../../config/redis"));
const jwt_1 = require("../../config/jwt");
const env_1 = require("../../config/env");
// --- Error Codes for Frontend Mapping ---
exports.AuthErrors = {
    INVALID_PHONE: 'AUTH_001',
    OTP_EXPIRED: 'AUTH_002',
    OTP_INVALID: 'AUTH_003',
    USER_SUSPENDED: 'AUTH_004',
    TOKEN_INVALID: 'AUTH_005',
    RATE_LIMIT_EXCEEDED: 'AUTH_006',
    ROLE_MISMATCH: 'AUTH_007',
    USER_NOT_FOUND: 'AUTH_008'
};
class AuthServiceError extends Error {
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.AuthServiceError = AuthServiceError;
// --- Helper Functions ---
/**
 * Normalizes phone number to Ethiopian standard format (+251...)
 * Handles: 0911..., 911..., +2519...
 */
const normalizePhoneNumber = (phone) => {
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
        return '+251' + cleaned.substring(1);
    }
    if (cleaned.startsWith('9') || cleaned.startsWith('7')) {
        return '+251' + cleaned;
    }
    if (cleaned.startsWith('251')) {
        return '+' + cleaned;
    }
    return cleaned;
};
/**
 * Generates a refined 6-digit OTP
 * In development, returns '123456' for specific test numbers
 */
const generateOTP = () => {
    if (env_1.isDev)
        return '123456'; // Easy testing
    return crypto_1.default.randomInt(100000, 999999).toString();
};
// --- Service Methods ---
/**
 * Request OTP for Login/Registration
 */
const requestOTP = async (phoneNumber, role = 'passenger') => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    // 1. Rate Limiting Check (5 attempts per hour)
    const attempts = await (0, redis_1.incrementCache)(redis_1.CacheNamespace.RATE_LIMIT, `otp:${normalizedPhone}`);
    if (attempts === 1) {
        // Set expiry for rate limit key on first attempt (1 hour)
        await redis_1.default.redis.expire(`${redis_1.CacheNamespace.RATE_LIMIT}otp:${normalizedPhone}`, 3600);
    }
    if (attempts > 5 && !env_1.isDev) {
        throw new AuthServiceError('Too many OTP requests. Please try again later.', exports.AuthErrors.RATE_LIMIT_EXCEEDED, 429);
    }
    // 2. Generate OTP
    const otp = generateOTP();
    // 3. Store in Redis (TTL: 5 minutes)
    // Store the requested role as well to enforce logic during verification if needed
    const otpData = JSON.stringify({ otp, role });
    await (0, redis_1.setCache)(redis_1.CacheNamespace.OTP, normalizedPhone, otpData, 300);
    // 4. Send SMS (Mock for now, integrate SMS provider later)
    console.log(`🔐 OTP for ${normalizedPhone}: ${otp}`);
    // TODO: Call SMS Service (e.g., Twilio, Infobip, or local Ethiopian gateway)
    // await smsService.send(normalizedPhone, `Your Bahir-Ride code is: ${otp}`);
};
exports.requestOTP = requestOTP;
/**
 * Verify OTP and Register/Login User
 */
const verifyOTP = async (phoneNumber, inputOtp) => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    // 1. Retrieve OTP from Redis
    const cachedDataStr = await (0, redis_1.getCache)(redis_1.CacheNamespace.OTP, normalizedPhone);
    if (!cachedDataStr) {
        throw new AuthServiceError('OTP expired or not requested', exports.AuthErrors.OTP_EXPIRED);
    }
    // Handle both string format (old) and json format (if we stored role)
    let cachedOtp;
    let cachedRole = 'passenger';
    try {
        const parsed = JSON.parse(cachedDataStr);
        cachedOtp = parsed.otp;
        cachedRole = parsed.role || 'passenger';
    }
    catch {
        cachedOtp = cachedDataStr;
    }
    // 2. Verify Code
    // Allow '123456' for dev/testing hardcoded backdoor if needed, currently reusing logic in generate
    if (inputOtp !== cachedOtp && !(env_1.isDev && inputOtp === '123456')) {
        throw new AuthServiceError('Invalid OTP', exports.AuthErrors.OTP_INVALID);
    }
    // 3. Clear OTP
    await (0, redis_1.deleteCache)(redis_1.CacheNamespace.OTP, normalizedPhone);
    // Optional: Clear rate limit on success
    await (0, redis_1.deleteCache)(redis_1.CacheNamespace.RATE_LIMIT, `otp:${normalizedPhone}`);
    // 4. Check/Create User in Database
    const client = await database_1.default.getClient();
    try {
        await client.query('BEGIN');
        // Check existence
        const userRes = await client.query(`SELECT * FROM users WHERE phone_number = $1`, [normalizedPhone]);
        let user = userRes.rows[0];
        let isNewUser = false;
        if (!user) {
            // Auto-Create User
            isNewUser = true;
            // Placeholder data
            const randomPwd = crypto_1.default.randomBytes(16).toString('hex'); // Users via OTP don't have passwords initially
            const firstName = 'New';
            const lastName = cachedRole === 'driver' ? 'Driver' : 'User';
            const insertUserRes = await client.query(`INSERT INTO users (
            phone_number, 
            password_hash, 
            first_name, 
            last_name, 
            role, 
            status,
            country_code
         ) VALUES ($1, $2, $3, $4, $5, 'active', '+251') 
         RETURNING *`, [normalizedPhone, randomPwd, firstName, lastName, cachedRole]);
            user = insertUserRes.rows[0];
            // If user is a PASSENGER, auto-create passenger profile
            // If user is a DRIVER, we CANNOT auto-create driver profile (needs license), 
            // so we leave it. They must complete profile later.
            if (cachedRole === 'passenger') {
                await client.query(`INSERT INTO passengers (user_id) VALUES ($1)`, [user.id]);
            }
        }
        else {
            // Existing User: Check Status
            if (user.status === 'suspended' || user.status === 'inactive') {
                throw new AuthServiceError('Account is suspended or inactive', exports.AuthErrors.USER_SUSPENDED, 403);
            }
            // Update last login
            await client.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);
        }
        await client.query('COMMIT');
        // 5. Generate Tokens
        // We use a token version strategy to allow invalidating all tokens for a user (e.g. on logout all)
        // For now, assume version 1 or store in DB. (Simplification: just use timestamp or 1)
        const tokenPayload = {
            userId: user.id,
            role: user.role, // Use actual role from DB
            tokenVersion: 1
        };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        // 6. Return Data
        return {
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                phoneNumber: user.phone_number,
                role: user.role,
                status: user.status,
                isNewUser
            },
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: jwt_1.jwtConfig.accessExpiry
            }
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.verifyOTP = verifyOTP;
/**
 * Rotate Refresh Token
 */
const refreshTokens = async (oldRefreshToken) => {
    // 1. Verify existing token
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(oldRefreshToken);
    }
    catch (err) {
        throw new AuthServiceError('Invalid or expired refresh token', exports.AuthErrors.TOKEN_INVALID, 401);
    }
    // 2. Check if user still exists/valid
    // Optional: Check a blacklist in Redis if we implement logout that blacklists refresh tokens
    // 3. Generate new tokens
    // We strictly copy the payload info but issue new times
    const newPayload = {
        userId: payload.userId,
        role: payload.role,
        tokenVersion: payload.tokenVersion
    };
    const accessToken = (0, jwt_1.generateAccessToken)(newPayload);
    const refreshToken = (0, jwt_1.generateRefreshToken)(newPayload);
    return {
        accessToken,
        refreshToken,
        expiresIn: jwt_1.jwtConfig.accessExpiry
    };
};
exports.refreshTokens = refreshTokens;
/**
 * Logout
 * Effectively invalidates the refresh token (client side discard)
 * Server side: We could blacklist the JTI or refresh token in Redis for remainder of its life
 */
const logout = async (refreshToken) => {
    // Implementation: Add to blacklist cache
    if (!refreshToken)
        return;
    try {
        // We can blacklist the token if we want strict security
        // For now, just a placeholder as JWTs are stateless unless blacklisted
        // const payload = verifyRefreshToken(refreshToken);
        // await setCache(CacheNamespace.BLACKLIST, refreshToken, 'true', remainingTTL);
    }
    catch (err) {
        // Ignore invalid tokens on logout
    }
};
exports.logout = logout;
/**
 * Get Current User Profile
 */
const getCurrentUser = async (userId, role) => {
    const result = await database_1.default.query(`SELECT 
      id, first_name, last_name, email, phone_number, 
      role, status, profile_picture_url, 
      fayda_id, last_login_at 
     FROM users WHERE id = $1`, [userId]);
    if (result.rows.length === 0) {
        throw new AuthServiceError('User not found', exports.AuthErrors.USER_NOT_FOUND, 404);
    }
    const user = result.rows[0];
    // If driver/passenger details needed, fetch them here
    let profileDetails = {};
    if (role === 'passenger') {
        const pRes = await database_1.default.query(`SELECT * FROM passengers WHERE user_id = $1`, [userId]);
        profileDetails = { passengerProfile: pRes.rows[0] || null };
    }
    else if (role === 'driver') {
        const dRes = await database_1.default.query(`SELECT * FROM drivers WHERE user_id = $1`, [userId]);
        profileDetails = { driverProfile: dRes.rows[0] || null };
    }
    return {
        ...user,
        ...profileDetails
    };
};
exports.getCurrentUser = getCurrentUser;
exports.default = {
    requestOTP: exports.requestOTP,
    verifyOTP: exports.verifyOTP,
    refreshTokens: exports.refreshTokens,
    logout: exports.logout,
    getCurrentUser: exports.getCurrentUser,
    AuthErrors: exports.AuthErrors
};
