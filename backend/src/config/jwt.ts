import jwt, { SignOptions } from 'jsonwebtoken';
import { 
  JWT_SECRET, 
  JWT_REFRESH_SECRET, 
  JWT_EXPIRES_IN, 
  JWT_REFRESH_EXPIRES_IN 
} from './env';

/**
 * JWT Configuration & Management
 * 
 * Provides centralized logic for generating and verifying JSON Web Tokens.
 * Supports dual-token strategy (Access + Refresh) and token versioning.
 */

export enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  DISPATCHER = 'dispatcher',
  SUPPORT = 'support',
  FLEET_MANAGER = 'fleet_manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum VerificationType {
  PHONE = 'phone',
  EMAIL = 'email',
  DOCUMENT = 'document'
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  tokenVersion: number; // For "Logout All Devices" functionality
}

const JWT_ISSUER = 'bahir-ride-api';
const JWT_AUDIENCE = 'bahir-ride-app';
const JWT_ALGORITHM = 'HS256';

/**
 * Generates a short-lived Access Token.
 * Used for authorizing individual API requests.
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: JWT_ALGORITHM
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Generates a long-lived Refresh Token.
 * Used to obtain new access tokens without re-authenticating.
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: JWT_ALGORITHM
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

/**
 * Verifies an Access Token.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: [JWT_ALGORITHM]
    }) as TokenPayload;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifies a Refresh Token.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: [JWT_ALGORITHM]
    }) as TokenPayload;
  } catch (error) {
    throw error;
  }
};

/**
 * Configuration Object for easy export
 */
export const jwtConfig = {
  accessSecret: JWT_SECRET,
  refreshSecret: JWT_REFRESH_SECRET,
  accessExpiry: JWT_EXPIRES_IN,
  refreshExpiry: JWT_REFRESH_EXPIRES_IN,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  algorithm: JWT_ALGORITHM
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  jwtConfig
};
