import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}
