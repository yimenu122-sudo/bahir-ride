"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const drivers_routes_1 = __importDefault(require("./modules/drivers/drivers.routes"));
const rides_routes_1 = __importDefault(require("./modules/rides/rides.routes"));
const payments_routes_1 = __importDefault(require("./modules/payments/payments.routes"));
const wallet_routes_1 = __importDefault(require("./modules/wallet/wallet.routes"));
const ticket_routes_1 = __importDefault(require("./modules/support/ticket.routes"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const router = (0, express_1.Router)();
// System Health Check
router.get('/health', async (req, res) => {
    const dbHealth = await (0, database_1.checkHealth)();
    const redisHealth = await (0, redis_1.checkRedisHealth)();
    const isHealthy = dbHealth.status === 'healthy' && redisHealth.status === 'healthy';
    const status = isHealthy ? 200 : 503;
    res.status(status).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        redis: redisHealth,
        server: 'up'
    });
});
router.use('/auth', auth_routes_1.default);
router.use('/users', users_routes_1.default);
router.use('/drivers', drivers_routes_1.default);
router.use('/rides', rides_routes_1.default);
router.use('/payments', payments_routes_1.default);
router.use('/wallet', wallet_routes_1.default);
router.use('/support', ticket_routes_1.default);
exports.default = router;
