import { Router } from 'express';
import { createColumn, renameColumn, moveColumn, deleteColumn, createColumnSchema, renameColumnSchema, moveColumnSchema, bulkCreateColumns, bulkCreateColumnSchema } from '../controllers/columns.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireBoardAccess, requireBoardRole } from '../middlewares/roleGuard';

export const columnsRoutes = Router({ mergeParams: true });

columnsRoutes.use(authGuard);
columnsRoutes.post('/bulk', requireBoardAccess(), requireBoardRole('EDITOR'), validate(bulkCreateColumnSchema), bulkCreateColumns);
columnsRoutes.post('/', requireBoardAccess(), requireBoardRole('EDITOR'), validate(createColumnSchema), createColumn);
columnsRoutes.patch('/:columnId/rename', requireBoardAccess(), requireBoardRole('EDITOR'), validate(renameColumnSchema), renameColumn);
columnsRoutes.patch('/:columnId/move', requireBoardAccess(), requireBoardRole('EDITOR'), validate(moveColumnSchema), moveColumn);
columnsRoutes.delete('/:columnId', requireBoardAccess(), requireBoardRole('EDITOR'), deleteColumn);
