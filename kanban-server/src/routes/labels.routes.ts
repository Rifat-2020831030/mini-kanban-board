import { Router } from 'express';
import { listLabels, createLabel, updateLabel, deleteLabel, tagTask, untagTask, createLabelSchema, updateLabelSchema, tagTaskSchema } from '../controllers/labels.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireBoardAccess, requireBoardRole, requireTaskAccess } from '../middlewares/roleGuard';

export const labelsRoutes = Router({ mergeParams: true });
export const taskLabelsRoutes = Router({ mergeParams: true });

labelsRoutes.use(authGuard);
labelsRoutes.get('/', requireBoardAccess(), listLabels);
labelsRoutes.post('/', requireBoardAccess(), requireBoardRole('EDITOR'), validate(createLabelSchema), createLabel);
labelsRoutes.put('/:labelId', requireBoardAccess(), requireBoardRole('EDITOR'), validate(updateLabelSchema), updateLabel);
labelsRoutes.delete('/:labelId', requireBoardAccess(), requireBoardRole('EDITOR'), deleteLabel);

taskLabelsRoutes.use(authGuard);
taskLabelsRoutes.post('/', requireTaskAccess('edit'), validate(tagTaskSchema), tagTask);
taskLabelsRoutes.delete('/:labelId', requireTaskAccess('edit'), untagTask);
