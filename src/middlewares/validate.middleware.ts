import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';

export const validateBody = <T>(schema: ZodType<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      return res.status(400).json({ message: 'Invalid payload' });
    }
  };
};
