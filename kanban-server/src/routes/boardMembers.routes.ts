import { Router } from 'express';
import { listBoardMembers, addBoardMember, updateBoardMember, removeBoardMember, addBoardMemberSchema, updateBoardMemberSchema } from '../controllers/boardMembers.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireBoardAccess, requireBoardRole } from '../middlewares/roleGuard';

export const boardMembersRoutes = Router({ mergeParams: true });

boardMembersRoutes.use(authGuard);
boardMembersRoutes.get('/', requireBoardAccess(), listBoardMembers);
boardMembersRoutes.post('/', requireBoardRole('OWNER'), validate(addBoardMemberSchema), addBoardMember);
boardMembersRoutes.put('/:memberId', requireBoardRole('OWNER'), validate(updateBoardMemberSchema), updateBoardMember);
boardMembersRoutes.delete('/:memberId', requireBoardAccess(), requireBoardRole('OWNER'), removeBoardMember);
