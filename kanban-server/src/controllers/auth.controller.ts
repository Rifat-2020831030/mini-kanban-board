import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { hashPassword, verifyPassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(255),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body;
    
    // Check existing
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Email or username already in use' } });
    }

    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email, password_hash },
    });

    const payload = { userId: user.id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { user_id: user.id, token_hash: await hashPassword(refreshToken), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.status(201).json({ user: { id: user.id, username, email }, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const payload = { userId: user.id };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { user_id: user.id, token_hash: await hashPassword(refreshToken), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({ user: { id: user.id, username: user.username, email }, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export async function refresh(req: Request, res: Response, next: NextFunction) {
  // Simple implementation
  res.json({ message: 'Not fully implemented yet' });
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  res.json({ success: true });
}
