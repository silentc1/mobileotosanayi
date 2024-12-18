import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    const user = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      fullName: string;
      avatar?: string;
      role: string;
    };

    req.user = {
      id: user.userId,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}; 