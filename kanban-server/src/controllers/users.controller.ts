import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: {} } });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found', details: {} } });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
