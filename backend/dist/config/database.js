"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.query = query;
exports.getClient = getClient;
exports.checkHealth = checkHealth;
const pg_1 = require("pg");
const env_1 = require("./env");
// PostgreSQL configuration with enhanced pooling and security
const poolConfig = {
    host: env_1.DB_HOST,
    port: env_1.DB_PORT,
    user: env_1.DB_USER,
    password: env_1.DB_PASSWORD,
    database: env_1.DB_NAME,
    // Pooling settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting a new client
    // SSL support for cloud databases (e.g., AWS RDS, DigitalOcean, Heroku)
    ssl: env_1.isProd ? { rejectUnauthorized: false } : false
};
const pool = new pg_1.Pool(poolConfig);
// Log unexpected errors on idle clients
pool.on('error', (err) => {
    console.error('⚠️ Unexpected error on idle PostgreSQL client:', err);
    // In production, we might not want to exit the process, but rather alert/log
    if (env_1.isProd) {
        // push to monitoring service
    }
    else {
        process.exit(-1);
    }
});
/**
 * Connects to the database and verifies connectivity.
 * Used during application startup.
 */
async function connectDatabase() {
    let client = null;
    try {
        client = await pool.connect();
        const res = await client.query('SELECT NOW(), current_database() as db');
        console.log(`✅ PostgreSQL Connected [${res.rows[0].db}] at ${res.rows[0].now}`);
    }
    catch (error) {
        console.error('❌ Database connection error:', error);
        // Critical failure: the app cannot function without DB
        process.exit(1);
    }
    finally {
        if (client)
            client.release();
    }
}
/**
 * Standard query wrapper for simple one-off queries.
 * Includes slow query logging and performance tracking.
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // Log slow queries (> 100ms in dev, > 500ms in prod)
        const slowThreshold = env_1.isProd ? 500 : 100;
        if (duration > slowThreshold) {
            console.warn(`🐢 Slow Query (${duration}ms):`, { text, rowCount: res.rowCount });
        }
        return res;
    }
    catch (error) {
        console.error('❌ Database Query Error:', { text, error });
        throw error;
    }
}
/**
 * Provides a client from the pool for transactions.
 * MUST call client.release() when finished.
 */
async function getClient() {
    const client = await pool.connect();
    return client;
}
/**
 * Health check for monitoring systems.
 */
async function checkHealth() {
    const start = Date.now();
    try {
        await pool.query('SELECT 1');
        return { status: 'healthy', latency: Date.now() - start };
    }
    catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}
exports.default = {
    query,
    getClient,
    connectDatabase,
    checkHealth,
    pool
};
