import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../../config/database';
import { sendEmail } from '../../utils/email';
import redisConfig, { CacheNamespace, setCache, getCache, deleteCache, incrementCache } from '../../config/redis';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  UserRole,
  jwtConfig,
  TokenPayload
} from '../../config/jwt';
import { isDev } from '../../config/env';

// --- Error Codes for Frontend Mapping ---
export const AuthErrors = {
  INVALID_PHONE: 'AUTH_001',
  OTP_EXPIRED: 'AUTH_002', 
  OTP_INVALID: 'AUTH_003',
  USER_SUSPENDED: 'AUTH_004',
  TOKEN_INVALID: 'AUTH_005',
  RATE_LIMIT_EXCEEDED: 'AUTH_006',
  ROLE_MISMATCH: 'AUTH_007',
  USER_NOT_FOUND: 'AUTH_008',
  PHONE_NOT_VERIFIED: 'AUTH_009'
};

export class AuthServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// --- Helper Functions ---

/**
 * Normalizes phone number to Ethiopian standard format (+251...)
 * Handles: 0911..., 911..., +2519...
 */
const normalizePhoneNumber = (phone: string): string => {
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
const generateOTP = (): string => {
  // Always generate a random OTP, even in dev mode, to ensure unique codes every time
  return crypto.randomInt(100000, 999999).toString();
};

// --- Service Methods ---

/**
 * Request OTP for Login (Login Only)
 */
export const requestOTP = async (phoneNumber: string, role: string = 'passenger', email?: string): Promise<void> => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // 1. Rate Limiting Check (5 attempts per hour)
  const attempts = await incrementCache(CacheNamespace.RATE_LIMIT, `otp:${normalizedPhone}`);
  if (attempts === 1) {
    // Set expiry for rate limit key on first attempt (1 hour)
    await redisConfig.redis.expire(`${CacheNamespace.RATE_LIMIT}otp:${normalizedPhone}`, 3600);
  }
  
  if (attempts > 5 && !isDev) {
    throw new AuthServiceError('Too many OTP requests. Please try again later.', AuthErrors.RATE_LIMIT_EXCEEDED, 429);
  }

  // 2. Resolve Email Address
  let targetEmail = email;
  if (!targetEmail) {
    // Try to find user email from DB if not provided (e.g., during login)
    const userRes = await db.query('SELECT email FROM users WHERE phone_number = $1', [normalizedPhone]);
    if (userRes.rows.length > 0 && userRes.rows[0].email) {
      targetEmail = userRes.rows[0].email;
    }
  }

  if (!targetEmail) {
    // If we can't find an email, we cannot fulfill the "Email Only" requirement
    throw new AuthServiceError('No email address associated with this account. Cannot send verification code.', AuthErrors.USER_NOT_FOUND, 404);
  }

  // 3. Generate OTP
  const otp = generateOTP();

  // 4. Store in Redis (TTL: 5 minutes)
  const otpData = JSON.stringify({ otp, role });
  await setCache(CacheNamespace.OTP, normalizedPhone, otpData, 300);

  // 4b. Record in Database if user exists
  try {
    const userRes = await db.query('SELECT id FROM users WHERE phone_number = $1', [normalizedPhone]);
    if (userRes.rows.length > 0) {
      const userId = userRes.rows[0].id;
      // Delete old pending verifications for this user and type
      await db.query(
        'DELETE FROM user_verifications WHERE user_id = $1 AND verification_type = $2 AND verified = false', 
        [userId, 'phone']
      );
      // Insert new verification record
      await db.query(
        `INSERT INTO user_verifications (user_id, verification_type, verification_code, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [userId, 'phone', otp, new Date(Date.now() + 5 * 60 * 1000)] // 5 mins expiry
      );
    }
  } catch (dbErr) {
    console.warn('Failed to log verification to DB', dbErr);
    // Continue anyway as Redis is primary for OTP check
  }

  // 5. Send Email
  console.log(`🔐 OTP generated for ${normalizedPhone} (Sending to ${targetEmail}): ${otp}`);

  await sendEmail(
    targetEmail,
    'Bahir-Ride Verification Code',
    `Your verification code is: ${otp}`,
    `
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
      <h2>Bahir-Ride Verification</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #00A86B; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
    </div>
    `
  );
};

/**
 * Register User: Create pending user and request OTP
 */
export const registerUsingOTP = async (data: any) => {
  const normalizedPhone = normalizePhoneNumber(data.phone);
  
  // 1. Check if user already exists
  const existingUser = await db.query('SELECT id FROM users WHERE phone_number = $1', [normalizedPhone]);
  if (existingUser.rows.length > 0) {
    throw new AuthServiceError('Phone number already registered', AuthErrors.INVALID_PHONE, 400);
  }

  // 2. Hash Password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 3. Create User in Pending Status
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const insertUserRes = await client.query(
      `INSERT INTO users (
          phone_number, 
          password_hash, 
          first_name, 
          last_name, 
          role, 
          status,
          country_code,
          email,
          date_of_birth,
          gender,
          fayda_id,
          fayda_id_front_url,
          fayda_id_back_url
       ) VALUES ($1, $2, $3, $4, $5, 'pending', '+251', $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        normalizedPhone, 
        passwordHash, 
        data.first_name, 
        data.last_name, 
        data.role || 'passenger', 
        data.email || null, 
        data.date_of_birth || null, 
        data.gender || null, 
        data.fayda_id || null, 
        data.fayda_id_front_image || data.fayda_id_front_url || null, 
        data.fayda_id_back_image || data.fayda_id_back_url || null
      ]
    );

    const user = insertUserRes.rows[0];

    // If passenger, create profile
    if (user.role === 'passenger') {
      await client.query('INSERT INTO passengers (user_id) VALUES ($1)', [user.id]);
    }

    await client.query('COMMIT');

    // 4. Trigger OTP
    await requestOTP(normalizedPhone, user.role, user.email);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Verify OTP and Register/Login User
 */
export const verifyOTP = async (phoneNumber: string, inputOtp: string) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // 1. Retrieve OTP from Redis
  const cachedData = await getCache<any>(CacheNamespace.OTP, normalizedPhone);
  
  if (!cachedData) {
    throw new AuthServiceError('OTP expired or not requested', AuthErrors.OTP_EXPIRED);
  }

  // Handle both string format (old/legacy) and object format
  let cachedOtp: string;
  let cachedRole: string = 'passenger';
  
  if (typeof cachedData === 'object' && cachedData !== null && cachedData.otp) {
    cachedOtp = cachedData.otp;
    cachedRole = cachedData.role || 'passenger';
  } else {
    // If it's just a string, it's the OTP itself
    cachedOtp = String(cachedData); 
  }

  // 2. Verify Code
  // Ensure we compare strings to strings
  if (String(inputOtp).trim() !== String(cachedOtp).trim()) {
    throw new AuthServiceError('Invalid OTP', AuthErrors.OTP_INVALID);
  }

  // 3. Clear OTP
  await deleteCache(CacheNamespace.OTP, normalizedPhone);
  // Optional: Clear rate limit on success
  await deleteCache(CacheNamespace.RATE_LIMIT, `otp:${normalizedPhone}`);

  // 4. Update User Status in Database
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check existence
    const userRes = await client.query(
      `SELECT * FROM users WHERE phone_number = $1`,
      [normalizedPhone]
    );

    let user = userRes.rows[0];

    if (!user) {
      throw new AuthServiceError('User not found', AuthErrors.USER_NOT_FOUND, 404);
    }

    // Activate User if Pending
    if (user.status === 'pending') {
      await client.query(
        `UPDATE users SET status = 'active' WHERE id = $1`,
        [user.id]
      );
      user.status = 'active';
    } else if (user.status === 'suspended' || user.status === 'inactive') {
      throw new AuthServiceError('Account is suspended or inactive', AuthErrors.USER_SUSPENDED, 403);
    }
    
    // 4b. Mark as verified in DB
    await client.query(
      `UPDATE user_verifications 
       SET verified = true, verified_at = NOW() 
       WHERE user_id = $1 AND verification_type = 'phone' AND verified = false`,
      [user.id]
    );

    // Update last login
    await client.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );

    await client.query('COMMIT');

    // 5. Generate Tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      tokenVersion: 1 
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 6. Return Data
    return {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        role: user.role,
        status: user.status,
        isNewUser: false // No longer used for registration logic here
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: jwtConfig.accessExpiry
      }
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Rotate Refresh Token
 */
export const refreshTokens = async (oldRefreshToken: string) => {
  // 1. Verify existing token
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch (err) {
    throw new AuthServiceError('Invalid or expired refresh token', AuthErrors.TOKEN_INVALID, 401);
  }

  // 2. Check if user still exists/valid
  // Optional: Check a blacklist in Redis if we implement logout that blacklists refresh tokens

  // 3. Generate new tokens
  // We strictly copy the payload info but issue new times
  const newPayload: TokenPayload = {
    userId: payload.userId,
    role: payload.role,
    tokenVersion: payload.tokenVersion
  };

  const accessToken = generateAccessToken(newPayload);
  const refreshToken = generateRefreshToken(newPayload);

  return {
    accessToken,
    refreshToken,
    expiresIn: jwtConfig.accessExpiry
  };
};

/**
 * Logout
 * Effectively invalidates the refresh token (client side discard)
 * Server side: We could blacklist the JTI or refresh token in Redis for remainder of its life
 */
export const logout = async (refreshToken: string) => {
  // Implementation: Add to blacklist cache
  if (!refreshToken) return;
  
  try {
    // We can blacklist the token if we want strict security
    // For now, just a placeholder as JWTs are stateless unless blacklisted
    // const payload = verifyRefreshToken(refreshToken);
    // await setCache(CacheNamespace.BLACKLIST, refreshToken, 'true', remainingTTL);
  } catch (err) {
    // Ignore invalid tokens on logout
  }
};

/**
 * Get Current User Profile
 */
export const getCurrentUser = async (userId: string, role: string) => {
  const result = await db.query(
    `SELECT 
      id, first_name, last_name, email, phone_number, 
      role, status, profile_picture_url, 
      fayda_id, last_login_at 
     FROM users WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new AuthServiceError('User not found', AuthErrors.USER_NOT_FOUND, 404);
  }

  const user = result.rows[0];
  
  // If driver/passenger details needed, fetch them here
  let profileDetails = {};
  if (role === 'passenger') {
    const pRes = await db.query(`SELECT * FROM passengers WHERE user_id = $1`, [userId]);
    profileDetails = { passengerProfile: pRes.rows[0] || null };
  } else if (role === 'driver') {
    const dRes = await db.query(`SELECT * FROM drivers WHERE user_id = $1`, [userId]);
    profileDetails = { driverProfile: dRes.rows[0] || null };
  }

  return {
    ...user,
    ...profileDetails
  };
};

/**
 * Login User (Password)
 */
export const login = async (identifier: string, password: any) => {
  const normalizedIdentifier = identifier.includes('@') ? identifier.toLowerCase() : normalizePhoneNumber(identifier);

  const query = identifier.includes('@') 
    ? 'SELECT * FROM users WHERE email = $1' 
    : 'SELECT * FROM users WHERE phone_number = $1';

  const result = await db.query(query, [normalizedIdentifier]);

  if (result.rows.length === 0) {
    throw new AuthServiceError('Invalid phone/email or password', AuthErrors.INVALID_PHONE, 401);
  }

  const user = result.rows[0];

  // Check if phone verified (status)
  if (user.status === 'pending') {
    // We can either auto-trigger OTP here or tell frontend to go to OTP screen
    // For this flow, we tell frontend to navigate to verify screen
    throw new AuthServiceError('Phone not verified. Please verify your account.', 'AUTH_009', 403);
  }

  // Check if password is correct
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AuthServiceError('Invalid phone/email or password', AuthErrors.INVALID_PHONE, 401);
  }

  // Check Status
  if (user.status === 'suspended' || user.status === 'inactive') {
    throw new AuthServiceError('Account is suspended or inactive', AuthErrors.USER_SUSPENDED, 403);
  }

  // Generate Tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    role: user.role,
    tokenVersion: 1
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Update last login
  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  return {
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      phoneNumber: user.phone_number,
      role: user.role,
      status: user.status
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: jwtConfig.accessExpiry
    }
  };
};

export default {
  requestOTP,
  verifyOTP,
  refreshTokens,
  logout,
  getCurrentUser,
  login,
  AuthErrors
};
