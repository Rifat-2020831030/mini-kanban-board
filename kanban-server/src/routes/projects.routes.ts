import { Router } from 'express';
import { createProject, getMyProject, updateProject, createProjectSchema, updateProjectSchema } from '../controllers/projects.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireProjectAdmin } from '../middlewares/roleGuard';

export const projectsRoutes = Router();

projectsRoutes.use(authGuard);
projectsRoutes.post('/', validate(createProjectSchema), createProject);
projectsRoutes.get('/me', getMyProject);
projectsRoutes.patch('/:projectId', requireProjectAdmin(), validate(updateProjectSchema), updateProject);
