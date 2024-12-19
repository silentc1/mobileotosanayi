import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        avatar?: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    console.log('Verifying token with secret:', config.jwtSecret ? '***' + config.jwtSecret.slice(-6) : 'NOT SET'); // Debug log
    const user = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      email: string;
      fullName: string;
      avatar?: string;
      role: string;
    };

    console.log('Token verified successfully:', { userId: user.userId }); // Debug log

    req.user = {
      id: user.userId,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error); // Debug log
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}; 