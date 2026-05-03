import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user && (req as any).user.role === 'admin') {
        return next();
    }

    return res.status(403).json({
        message: 'Forbidden: You do not have permission to perform this action'
    });
};
