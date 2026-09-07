import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export function validate(schema: ZodObject<any, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
          },
        });
      }
      return next(error);
    }
  };
}
