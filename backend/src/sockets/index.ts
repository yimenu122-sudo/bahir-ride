import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};
