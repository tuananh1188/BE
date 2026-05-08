import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserModel } from '../models/user.model';


export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    
    // Check if user is blocked in database
    const user = await UserModel.findById(decoded.sub).select('isBlocked');
    if (!user || user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked or does not exist.' });
    }
    
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

