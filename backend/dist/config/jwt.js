"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = exports.UserRole = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
/**
 * JWT Configuration & Management
 *
 * Provides centralized logic for generating and verifying JSON Web Tokens.
 * Supports dual-token strategy (Access + Refresh) and token versioning.
 */
var UserRole;
(function (UserRole) {
    UserRole["PASSENGER"] = "passenger";
    UserRole["DRIVER"] = "driver";
    UserRole["DISPATCHER"] = "dispatcher";
    UserRole["SUPPORT"] = "support";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
const JWT_ISSUER = 'bahir-ride-api';
const JWT_AUDIENCE = 'bahir-ride-app';
const JWT_ALGORITHM = 'HS256';
/**
 * Generates a short-lived Access Token.
 * Used for authorizing individual API requests.
 */
const generateAccessToken = (payload) => {
    const options = {
        expiresIn: env_1.JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithm: JWT_ALGORITHM
    };
    return jsonwebtoken_1.default.sign(payload, env_1.JWT_SECRET, options);
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generates a long-lived Refresh Token.
 * Used to obtain new access tokens without re-authenticating.
 */
const generateRefreshToken = (payload) => {
    const options = {
        expiresIn: env_1.JWT_REFRESH_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithm: JWT_ALGORITHM
    };
    return jsonwebtoken_1.default.sign(payload, env_1.JWT_REFRESH_SECRET, options);
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verifies an Access Token.
 */
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            algorithms: [JWT_ALGORITHM]
        });
    }
    catch (error) {
        throw error;
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verifies a Refresh Token.
 */
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.JWT_REFRESH_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            algorithms: [JWT_ALGORITHM]
        });
    }
    catch (error) {
        throw error;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Configuration Object for easy export
 */
exports.jwtConfig = {
    accessSecret: env_1.JWT_SECRET,
    refreshSecret: env_1.JWT_REFRESH_SECRET,
    accessExpiry: env_1.JWT_EXPIRES_IN,
    refreshExpiry: env_1.JWT_REFRESH_EXPIRES_IN,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: JWT_ALGORITHM
};
exports.default = {
    generateAccessToken: exports.generateAccessToken,
    generateRefreshToken: exports.generateRefreshToken,
    verifyAccessToken: exports.verifyAccessToken,
    verifyRefreshToken: exports.verifyRefreshToken,
    jwtConfig: exports.jwtConfig
};
