import { Router } from 'express';
import { register, login, refresh, logout, registerSchema, loginSchema, refreshSchema, logoutSchema } from '../controllers/auth.controller';
import { getMe } from '../controllers/users.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authGuard } from '../middlewares/authGuard';

const router = Router();

router.post('/auth/register', validateRequest(registerSchema), register);
router.post('/auth/login', validateRequest(loginSchema), login);
router.post('/auth/refresh', validateRequest(refreshSchema), refresh);
router.post('/auth/logout', authGuard, validateRequest(logoutSchema), logout);

router.get('/users/me', authGuard, getMe);

export default router;
