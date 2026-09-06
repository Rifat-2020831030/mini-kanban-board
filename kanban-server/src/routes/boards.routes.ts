import { Router } from 'express';
import { createBoard, listBoards, getBoardById, updateBoard, deleteBoard, createBoardSchema, updateBoardSchema } from '../controllers/boards.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireBoardAccess, requireBoardRole } from '../middlewares/roleGuard';

export const boardsRoutes = Router();

boardsRoutes.use(authGuard);
boardsRoutes.post('/', validate(createBoardSchema), createBoard);
boardsRoutes.get('/', listBoards);
boardsRoutes.get('/:boardId', requireBoardAccess(), getBoardById);
boardsRoutes.put('/:boardId', requireBoardRole('EDITOR'), validate(updateBoardSchema), updateBoard);
boardsRoutes.delete('/:boardId', requireBoardRole('OWNER'), deleteBoard);
