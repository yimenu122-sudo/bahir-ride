"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const sockets_1 = require("./sockets");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
dotenv_1.default.config();
const port = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Socket initialization
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
(0, sockets_1.setupSockets)(io);
// Initialize Database and Start Server
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        server.listen(port, () => {
            logger_1.logger.info(`🚀 Server running on http://localhost:${port}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
