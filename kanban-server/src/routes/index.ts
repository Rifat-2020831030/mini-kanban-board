import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';

import { projectsRoutes } from './projects.routes';
import { projectMembersRoutes } from './projectMembers.routes';
import { boardsRoutes } from './boards.routes';
import { boardMembersRoutes } from './boardMembers.routes';
import { columnsRoutes } from './columns.routes';
import { tasksRoutes } from './tasks.routes';
import { taskAssigneesRoutes } from './taskAssignees.routes';
import { labelsRoutes, taskLabelsRoutes } from './labels.routes';
import { subtasksRoutes } from './subtasks.routes';

export const routes = Router();

routes.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

routes.use('/auth', authRoutes);
routes.use('/users', usersRoutes);
routes.use('/projects', projectsRoutes);
routes.use('/projects/:projectId/members', projectMembersRoutes);
routes.use('/boards', boardsRoutes);
routes.use('/boards/:boardId/members', boardMembersRoutes);
routes.use('/boards/:boardId/columns', columnsRoutes);
routes.use('/boards/:boardId/tasks', tasksRoutes);
routes.use('/boards/:boardId/tasks/:taskId/assignees', taskAssigneesRoutes);
routes.use('/boards/:boardId/labels', labelsRoutes);
routes.use('/boards/:boardId/tasks/:taskId/labels', taskLabelsRoutes);
routes.use('/boards/:boardId/tasks/:taskId/subtasks', subtasksRoutes);
