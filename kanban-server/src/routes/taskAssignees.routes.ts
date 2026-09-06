import { Router } from 'express';
import { addAssignee, removeAssignee, addAssigneeSchema } from '../controllers/taskAssignees.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireTaskAccess } from '../middlewares/roleGuard';

export const taskAssigneesRoutes = Router({ mergeParams: true });

taskAssigneesRoutes.use(authGuard);
taskAssigneesRoutes.post('/', requireTaskAccess('edit'), validate(addAssigneeSchema), addAssignee);
taskAssigneesRoutes.delete('/:userId', requireTaskAccess('edit'), removeAssignee);
