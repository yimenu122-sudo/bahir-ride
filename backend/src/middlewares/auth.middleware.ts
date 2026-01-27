import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../config/jwt';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const execute = async (req: Request, res: Response, next: NextFunction) => {
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
    const decoded = verifyAccessToken(token);

    // 3. Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token'
    });
  }
};

// Alias for cleaner imports
export const protect = execute;
