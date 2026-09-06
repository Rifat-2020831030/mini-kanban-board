import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId;
    const members = await prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
}

export const inviteMemberSchema = z.object({
  body: z.object({
    emailOrUsername: z.string(),
  }),
});

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId;
    const { emailOrUsername } = req.body;
    const userId = req.user!.userId;

    const targetUser = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    });

    if (!targetUser) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot invite yourself' } });
    }

    const inProject = await prisma.projectMember.findFirst({
      where: { user_id: targetUser.id },
    });

    if (inProject) {
      if (inProject.project_id === projectId) {
        return res.status(409).json({ error: { code: 'ALREADY_MEMBER', message: 'User already in this project' } });
      }
      return res.status(409).json({ error: { code: 'ALREADY_IN_PROJECT', message: 'User already in another project' } });
    }

    const member = await prisma.projectMember.create({
      data: { project_id: projectId, user_id: targetUser.id, role: 'MEMBER' },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
}

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MEMBER']),
  }),
});

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId;
    const memberId = req.params.memberId;
    const { role } = req.body;

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    res.json(member);
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const memberId = req.params.memberId;
    
    const member = await prisma.projectMember.findUnique({ where: { id: memberId } });
    if (!member) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found' } });
    }

    await prisma.$transaction(async (tx) => {
      // cascade delete their BoardMember rows in boards belonging to this project
      const boards = await tx.board.findMany({ where: { project_id: member.project_id } });
      const boardIds = boards.map(b => b.id);
      
      await tx.boardMember.deleteMany({
        where: { user_id: member.user_id, board_id: { in: boardIds } },
      });

      await tx.projectMember.delete({ where: { id: memberId } });
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
