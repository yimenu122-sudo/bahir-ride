"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CBE_BIRR_API_KEY = exports.TELEBIRR_PUBLIC_KEY = exports.TELEBIRR_APP_KEY = exports.TELEBIRR_MERCHANT_APP_ID = exports.SMS_SENDER_ID = exports.SMS_API_KEY = exports.BCRYPT_SALT_ROUNDS = exports.JWT_REFRESH_EXPIRES_IN = exports.JWT_EXPIRES_IN = exports.JWT_REFRESH_SECRET = exports.JWT_SECRET = exports.REDIS_PASSWORD = exports.REDIS_PORT = exports.REDIS_HOST = exports.DB_NAME = exports.DB_PASSWORD = exports.DB_USER = exports.DB_PORT = exports.DB_HOST = exports.API_PREFIX = exports.PORT = exports.isTest = exports.isProd = exports.isDev = exports.NODE_ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
// --- Application Mode ---
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.isDev = exports.NODE_ENV === 'development';
exports.isProd = exports.NODE_ENV === 'production';
exports.isTest = exports.NODE_ENV === 'test';
// --- Server Configuration ---
exports.PORT = Number(process.env.PORT || 5000);
exports.API_PREFIX = process.env.API_PREFIX || '/api';
// --- Database Configuration ---
exports.DB_HOST = process.env.DB_HOST || 'localhost';
exports.DB_PORT = Number(process.env.DB_PORT || 5432);
exports.DB_USER = process.env.DB_USER || 'postgres';
exports.DB_PASSWORD = process.env.DB_PASSWORD || 'yime_IS_2';
exports.DB_NAME = process.env.DB_NAME || 'bahirdar_ride_db';
// --- Redis Configuration ---
exports.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
exports.REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
exports.REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
// --- Security & Authentication ---
exports.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
exports.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key';
exports.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
exports.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
exports.BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
// --- External Services (SMS & Payments) ---
exports.SMS_API_KEY = process.env.SMS_API_KEY || '';
exports.SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'BahirRide';
exports.TELEBIRR_MERCHANT_APP_ID = process.env.TELEBIRR_MERCHANT_APP_ID || '';
exports.TELEBIRR_APP_KEY = process.env.TELEBIRR_APP_KEY || '';
exports.TELEBIRR_PUBLIC_KEY = process.env.TELEBIRR_PUBLIC_KEY || '';
exports.CBE_BIRR_API_KEY = process.env.CBE_BIRR_API_KEY || '';
