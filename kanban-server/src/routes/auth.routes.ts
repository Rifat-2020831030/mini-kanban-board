import { Router } from 'express';
import { register, login, refresh, logout, registerSchema, loginSchema, refreshSchema } from '../controllers/auth.controller';
import { validate } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), register);
authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/refresh', validate(refreshSchema), refresh);
authRoutes.post('/logout', authGuard, logout);
