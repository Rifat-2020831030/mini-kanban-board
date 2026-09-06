import { Router } from 'express';
import { createSubtask, updateSubtask, deleteSubtask, createSubtaskSchema, updateSubtaskSchema } from '../controllers/subtasks.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireTaskAccess } from '../middlewares/roleGuard';

export const subtasksRoutes = Router({ mergeParams: true });

subtasksRoutes.use(authGuard);
subtasksRoutes.post('/', requireTaskAccess('edit'), validate(createSubtaskSchema), createSubtask);
subtasksRoutes.put('/:subtaskId', requireTaskAccess('edit'), validate(updateSubtaskSchema), updateSubtask);
subtasksRoutes.delete('/:subtaskId', requireTaskAccess('edit'), deleteSubtask);
