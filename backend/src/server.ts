import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { Server } from 'socket.io';
import { setupSockets } from './sockets';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';

dotenv.config();

const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSockets(io);

// Initialize Database and Start Server
const startServer = async () => {
  try {
    await connectDatabase();
    server.listen(port, () => {
      logger.info(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
