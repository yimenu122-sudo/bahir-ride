import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import driverRoutes from './modules/drivers/drivers.routes';
import rideRoutes from './modules/rides/rides.routes';
import paymentRoutes from './modules/payments/payments.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import supportRoutes from './modules/support/ticket.routes';
import { checkHealth } from './config/database';
import { checkRedisHealth } from './config/redis';

const router = Router();

// System Health Check
router.get('/health', async (req, res) => {
  const dbHealth = await checkHealth();
  const redisHealth = await checkRedisHealth();
  
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

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/rides', rideRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallet', walletRoutes);
router.use('/support', supportRoutes);

export default router;
