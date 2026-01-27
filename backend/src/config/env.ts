import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// --- Application Mode ---
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const isDev = NODE_ENV === 'development'
export const isProd = NODE_ENV === 'production'
export const isTest = NODE_ENV === 'test'

// --- Server Configuration ---
export const PORT = Number(process.env.PORT || 5000)
export const API_PREFIX = process.env.API_PREFIX || '/api'

// --- Database Configuration ---
export const DB_HOST = process.env.DB_HOST || 'localhost'
export const DB_PORT = Number(process.env.DB_PORT || 5432)
export const DB_USER = process.env.DB_USER || 'postgres'
export const DB_PASSWORD = process.env.DB_PASSWORD || 'yime_IS_2'
export const DB_NAME = process.env.DB_NAME || 'bahirdar_ride_db'

// --- Redis Configuration ---
export const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
export const REDIS_PORT = Number(process.env.REDIS_PORT || 6379)
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''

// --- Security & Authentication ---
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod'
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'
export const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10)

// --- External Services (SMS & Payments) ---
export const SMS_API_KEY = process.env.SMS_API_KEY || ''
export const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'BahirRide'

export const TELEBIRR_MERCHANT_APP_ID = process.env.TELEBIRR_MERCHANT_APP_ID || ''
export const TELEBIRR_APP_KEY = process.env.TELEBIRR_APP_KEY || ''
export const TELEBIRR_PUBLIC_KEY = process.env.TELEBIRR_PUBLIC_KEY || ''
export const CBE_BIRR_API_KEY = process.env.CBE_BIRR_API_KEY || ''
