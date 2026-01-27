"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheNamespace = void 0;
exports.setCache = setCache;
exports.getCache = getCache;
exports.deleteCache = deleteCache;
exports.incrementCache = incrementCache;
exports.checkRedisHealth = checkRedisHealth;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
/**
 * Redis Connection Manager
 *
 * Handles caching, fast in-memory lookups, and real-time state management.
 * Optimized for OTP storage, rate limiting, and ride tracking.
 */
const redisConfig = {
    host: env_1.REDIS_HOST,
    port: env_1.REDIS_PORT,
    password: env_1.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        // Exponential backoff for reconnection
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3, // Prevent blocking if Redis is down
};
const redis = new ioredis_1.default(redisConfig);
// Event Listeners
redis.on('connect', () => {
    console.log('⚡ Redis connecting...');
});
redis.on('ready', () => {
    console.log('✅ Redis Client Ready');
});
redis.on('error', (error) => {
    console.error('❌ Redis Error:', error);
});
/**
 * Cache Namespaces
 * Use these to keep keys organized and avoid collisions.
 */
var CacheNamespace;
(function (CacheNamespace) {
    CacheNamespace["OTP"] = "otp:";
    CacheNamespace["SESSION"] = "sess:";
    CacheNamespace["RIDE_STATE"] = "ride:";
    CacheNamespace["RATE_LIMIT"] = "rl:";
    CacheNamespace["SOCKET_MAPPING"] = "sock:";
})(CacheNamespace || (exports.CacheNamespace = CacheNamespace = {}));
/**
 * Set a value in cache with an optional TTL.
 */
async function setCache(namespace, key, value, ttlSeconds) {
    try {
        const fullKey = `${namespace}${key}`;
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            await redis.set(fullKey, stringValue, 'EX', ttlSeconds);
        }
        else {
            await redis.set(fullKey, stringValue);
        }
    }
    catch (error) {
        console.error(`❌ Redis Set Error [${namespace}${key}]:`, error);
    }
}
/**
 * Get a value from cache.
 */
async function getCache(namespace, key) {
    try {
        const fullKey = `${namespace}${key}`;
        const value = await redis.get(fullKey);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    catch (error) {
        console.error(`❌ Redis Get Error [${namespace}${key}]:`, error);
        return null; // Graceful fallback
    }
}
/**
 * Delete a value from cache.
 */
async function deleteCache(namespace, key) {
    try {
        await redis.del(`${namespace}${key}`);
    }
    catch (error) {
        console.error(`❌ Redis Delete Error [${namespace}${key}]:`, error);
    }
}
/**
 * Atomic Increment (useful for rate limiting).
 */
async function incrementCache(namespace, key) {
    try {
        return await redis.incr(`${namespace}${key}`);
    }
    catch (error) {
        console.error(`❌ Redis Incr Error [${namespace}${key}]:`, error);
        return 0;
    }
}
/**
 * Health check for Redis connectivity.
 */
async function checkRedisHealth() {
    try {
        await redis.ping();
        return { status: 'healthy' };
    }
    catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}
exports.default = {
    redis,
    setCache,
    getCache,
    deleteCache,
    incrementCache,
    checkRedisHealth,
    CacheNamespace
};
