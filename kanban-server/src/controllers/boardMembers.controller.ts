import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { io } from '../socket';

export async function listBoardMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.params.boardId as string;
    const members = await prisma.boardMember.findMany({
      where: { board_id: boardId },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
}

export const addBoardMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    role: z.enum(['OWNER', 'EDITOR', 'MEMBER']),
    jobTitle: z.string().optional(),
  }),
});

export async function addBoardMember(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.params.boardId as string;
    const { userId, email, role, jobTitle } = req.body;
    let board = (req as any).board;

    if (!board) {
      board = await prisma.board.findUnique({ where: { id: boardId } });
    }

    if (!board) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
    }

    let targetUserId = userId;
    if (!targetUserId && email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'No registered user found with that email' } });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Either userId or email is required' } });
    }

    // Auto-ensure target user is a project member so Prisma relations pass
    await prisma.projectMember.upsert({
      where: { project_id_user_id: { project_id: board.project_id, user_id: targetUserId } },
      create: { project_id: board.project_id, user_id: targetUserId, role: 'MEMBER' },
      update: {},
    });

    const existingBoardMember = await prisma.boardMember.findUnique({
      where: { board_id_user_id: { board_id: boardId, user_id: targetUserId } },
    });

    if (existingBoardMember) {
      return res.status(409).json({ error: { code: 'ALREADY_MEMBER', message: 'User is already a member of this board' } });
    }

    const newMember = await prisma.boardMember.create({
      data: { board_id: boardId, user_id: targetUserId, role, job_title: jobTitle },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    io.to(`board:${boardId}`).emit('member:added', newMember);
    res.status(201).json(newMember);
  } catch (err) {
    next(err);
  }
}

export const updateBoardMemberSchema = z.object({
  body: z.object({
    role: z.enum(['OWNER', 'EDITOR', 'MEMBER']).optional(),
    jobTitle: z.string().optional(),
  }),
});

export async function updateBoardMember(req: Request, res: Response, next: NextFunction) {
  try {
    const memberId = req.params.memberId as string;
    const { role, jobTitle } = req.body;

    const member = await prisma.boardMember.update({
      where: { id: memberId },
      data: { role, job_title: jobTitle },
      include: { user: { select: { id: true, username: true, email: true } } },
    });

    io.to(`board:${member.board_id}`).emit('member:updated', member);
    res.json(member);
  } catch (err) {
    next(err);
  }
}

export async function removeBoardMember(req: Request, res: Response, next: NextFunction) {
  try {
    const memberId = req.params.memberId as string;
    const isProjectAdmin = (req as any).isProjectAdmin;

    const member = await prisma.boardMember.findUnique({ where: { id: memberId } });
    if (!member) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found' } });
    }

    if (member.role === 'OWNER' && !isProjectAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only project admin can remove a board OWNER' } });
    }

    await prisma.boardMember.delete({ where: { id: memberId } });

    io.to(`board:${member.board_id}`).emit('member:removed', { id: memberId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
