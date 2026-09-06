import { Router } from 'express';
import { listMembers, inviteMember, updateMemberRole, removeMember, inviteMemberSchema, updateMemberRoleSchema } from '../controllers/projectMembers.controller';
import { authGuard } from '../middlewares/authGuard';
import { validate } from '../middlewares/validateRequest';
import { requireProjectMember, requireProjectAdmin } from '../middlewares/roleGuard';

export const projectMembersRoutes = Router({ mergeParams: true });

projectMembersRoutes.use(authGuard);
projectMembersRoutes.get('/', requireProjectMember(), listMembers);
projectMembersRoutes.post('/', requireProjectAdmin(), validate(inviteMemberSchema), inviteMember);
projectMembersRoutes.put('/:memberId', requireProjectAdmin(), validate(updateMemberRoleSchema), updateMemberRole);
projectMembersRoutes.delete('/:memberId', requireProjectAdmin(), removeMember);
