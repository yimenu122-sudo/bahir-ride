import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, isProd } from './env';

/**
 * Redis Connection Manager
 * 
 * Handles caching, fast in-memory lookups, and real-time state management.
 * Optimized for OTP storage, rate limiting, and ride tracking.
 */

const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    // Exponential backoff for reconnection
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3, // Prevent blocking if Redis is down
};

const redis = new Redis(redisConfig);

// Event Listeners
redis.on('connect', () => {
  console.log('⚡ Redis: Connection initiated...');
});

redis.on('ready', () => {
  console.log('✅ Redis: Client Ready and Connected');
});

redis.on('error', (error: any) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Redis Connection Refused: No Redis server found at ' + error.address + ':' + error.port);
    console.error('💡 Tip: Ensure Redis is installed and running. On Windows, you can use Docker or WSL2.');
  } else {
    console.error('❌ Redis Error:', error.message || error);
  }
});

/**
 * Cache Namespaces
 * Use these to keep keys organized and avoid collisions.
 */
export enum CacheNamespace {
  OTP = 'otp:',
  SESSION = 'sess:',
  RIDE_STATE = 'ride:',
  RATE_LIMIT = 'rl:',
  SOCKET_MAPPING = 'sock:',
  REG_DATA = 'reg:'
}

/**
 * Set a value in cache with an optional TTL.
 */
export async function setCache(
  namespace: CacheNamespace,
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<void> {
  try {
    const fullKey = `${namespace}${key}`;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttlSeconds) {
      await redis.set(fullKey, stringValue, 'EX', ttlSeconds);
    } else {
      await redis.set(fullKey, stringValue);
    }
  } catch (error) {
    console.error(`❌ Redis Set Error [${namespace}${key}]:`, error);
  }
}

/**
 * Get a value from cache.
 */
export async function getCache<T>(namespace: CacheNamespace, key: string): Promise<T | null> {
  try {
    const fullKey = `${namespace}${key}`;
    const value = await redis.get(fullKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  } catch (error) {
    console.error(`❌ Redis Get Error [${namespace}${key}]:`, error);
    return null; // Graceful fallback
  }
}

/**
 * Delete a value from cache.
 */
export async function deleteCache(namespace: CacheNamespace, key: string): Promise<void> {
  try {
    await redis.del(`${namespace}${key}`);
  } catch (error) {
    console.error(`❌ Redis Delete Error [${namespace}${key}]:`, error);
  }
}

/**
 * Atomic Increment (useful for rate limiting).
 */
export async function incrementCache(namespace: CacheNamespace, key: string): Promise<number> {
  try {
    return await redis.incr(`${namespace}${key}`);
  } catch (error) {
    console.error(`❌ Redis Incr Error [${namespace}${key}]:`, error);
    return 0;
  }
}

/**
 * Health check for Redis connectivity.
 */
export async function checkRedisHealth(): Promise<{ status: string; error?: string }> {
  try {
    await redis.ping();
    return { status: 'healthy' };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
}

export default {
  redis,
  setCache,
  getCache,
  deleteCache,
  incrementCache,
  checkRedisHealth,
  CacheNamespace
};
