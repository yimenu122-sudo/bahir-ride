"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSockets = void 0;
const logger_1 = require("../utils/logger");
const setupSockets = (io) => {
    io.on('connection', (socket) => {
        logger_1.logger.info(`Socket connected: ${socket.id}`);
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            logger_1.logger.info(`Socket ${socket.id} joined room ${roomId}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`Socket disconnected: ${socket.id}`);
        });
    });
};
exports.setupSockets = setupSockets;
