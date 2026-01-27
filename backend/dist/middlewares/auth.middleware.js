"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.execute = void 0;
const jwt_1 = require("../config/jwt");
const execute = async (req, res, next) => {
    try {
        // 1. Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No token provided'
            });
        }
        const token = authHeader.split(' ')[1];
        // 2. Verify token
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // 3. Attach user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid token'
        });
    }
};
exports.execute = execute;
// Alias for cleaner imports
exports.protect = exports.execute;
