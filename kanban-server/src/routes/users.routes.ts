import { Router } from 'express';
import { getMe } from '../controllers/users.controller';
import { authGuard } from '../middlewares/authGuard';

export const usersRoutes = Router();

usersRoutes.get('/me', authGuard, getMe);
