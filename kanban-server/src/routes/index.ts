import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';

import { projectsRoutes } from './projects.routes';
import { projectMembersRoutes } from './projectMembers.routes';

export const routes = Router();

routes.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

routes.use('/auth', authRoutes);
routes.use('/users', usersRoutes);
routes.use('/projects', projectsRoutes);
routes.use('/projects/:projectId/members', projectMembersRoutes);
