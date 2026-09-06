import { Router } from 'express';
import { createTask, getTask, updateTask, moveTask, deleteTask, getTaskLifecycle, createTaskSchema, updateTaskSchema, moveTaskSchema } from '../controllers/tasks.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireBoardAccess, requireTaskAccess } from '../middlewares/roleGuard';

export const tasksRoutes = Router({ mergeParams: true });

tasksRoutes.use(authGuard);
// These are typically mounted at /boards/:boardId/tasks
tasksRoutes.post('/', requireBoardAccess(), validate(createTaskSchema), createTask);
tasksRoutes.get('/:taskId', requireTaskAccess('edit'), getTask); // edit implies read
tasksRoutes.patch('/:taskId', requireTaskAccess('edit'), validate(updateTaskSchema), updateTask);
tasksRoutes.patch('/:taskId/move', requireTaskAccess('move'), validate(moveTaskSchema), moveTask);
tasksRoutes.delete('/:taskId', requireTaskAccess('delete'), deleteTask);
tasksRoutes.get('/:taskId/lifecycle', requireTaskAccess('edit'), getTaskLifecycle);
