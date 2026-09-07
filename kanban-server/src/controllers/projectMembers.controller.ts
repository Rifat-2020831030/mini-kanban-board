import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = (req.params.projectId as string) as string;
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
    email: z.string().email("Invalid email format"),
    role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
  }),
});

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = (req.params.projectId as string) as string;
    const { email, role } = req.body;
    const userId = req.user!.userId;

    const targetUser = await prisma.user.findFirst({
      where: { email },
    });

    if (!targetUser) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User with this email not found. They must create an account first.' } });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Cannot invite yourself' } });
    }

    const inProject = await prisma.projectMember.findFirst({
      where: { project_id: projectId, user_id: targetUser.id },
    });

    if (inProject) {
      return res.status(409).json({ error: { code: 'ALREADY_MEMBER', message: 'User is already a member of this project.' } });
    }

    const member = await prisma.$transaction(async (tx) => {
      const pm = await tx.projectMember.create({
        data: { project_id: projectId, user_id: targetUser.id, role },
        include: { user: { select: { id: true, username: true, email: true } } },
      });

      const boards = await tx.board.findMany({
        where: { project_id: projectId, deleted_at: null },
      });

      for (const board of boards) {
        await tx.boardMember.upsert({
          where: { board_id_user_id: { board_id: board.id, user_id: targetUser.id } },
          create: {
            board_id: board.id,
            user_id: targetUser.id,
            role: role === 'ADMIN' ? 'OWNER' : 'MEMBER',
          },
          update: {
            role: role === 'ADMIN' ? 'OWNER' : 'MEMBER',
          },
        });
      }

      return pm;
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
    const projectId = (req.params.projectId as string) as string;
    const memberId = (req.params.memberId as string) as string;
    const { role } = req.body;

    const member = await prisma.$transaction(async (tx) => {
      const pm = await tx.projectMember.update({
        where: { id: memberId },
        data: { role },
        include: { user: { select: { id: true, username: true, email: true } } },
      });

      const boards = await tx.board.findMany({
        where: { project_id: projectId, deleted_at: null },
      });

      for (const board of boards) {
        await tx.boardMember.updateMany({
          where: { board_id: board.id, user_id: pm.user_id },
          data: { role: role === 'ADMIN' ? 'OWNER' : 'MEMBER' },
        });
      }

      return pm;
    });

    res.json(member);
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const memberId = (req.params.memberId as string) as string;
    
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
