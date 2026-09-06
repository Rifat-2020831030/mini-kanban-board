import { Router } from 'express';
import { createColumn, renameColumn, moveColumn, deleteColumn, createColumnSchema, renameColumnSchema, moveColumnSchema } from '../controllers/columns.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireBoardAccess, requireBoardRole } from '../middlewares/roleGuard';

export const columnsRoutes = Router({ mergeParams: true });

columnsRoutes.use(authGuard);
columnsRoutes.post('/', requireBoardAccess(), requireBoardRole('EDITOR'), validate(createColumnSchema), createColumn);
columnsRoutes.put('/:columnId/rename', requireBoardAccess(), requireBoardRole('EDITOR'), validate(renameColumnSchema), renameColumn);
columnsRoutes.put('/:columnId/move', requireBoardAccess(), requireBoardRole('EDITOR'), validate(moveColumnSchema), moveColumn);
columnsRoutes.delete('/:columnId', requireBoardAccess(), requireBoardRole('EDITOR'), deleteColumn);
