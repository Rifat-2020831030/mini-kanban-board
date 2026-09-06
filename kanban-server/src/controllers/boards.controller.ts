import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { io } from '../socket';

export const createBoardSchema = z.object({
  body: z.object({
    projectId: z.string().uuid(),
    name: z.string().min(1).max(255),
    description: z.string().nullable().optional(),
  }),
});

export async function createBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, name, description } = req.body;
    const userId = req.user!.userId;

    const projectMember = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
    });

    if (!projectMember || projectMember.role !== 'ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Must be project ADMIN to create boards' } });
    }

    const board = await prisma.$transaction(async (tx) => {
      const b = await tx.board.create({
        data: { project_id: projectId, name, description, created_by: userId },
      });
      await tx.boardMember.create({
        data: { board_id: b.id, user_id: userId, role: 'OWNER' },
      });
      return b;
    });

    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
}

export async function listBoards(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    const userId = req.user!.userId;

    if (!projectId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'projectId query param required' } });
    }

    const projectMember = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
    });

    if (!projectMember) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a project member' } });
    }

    const boards = await prisma.board.findMany({
      where: {
        project_id: projectId,
        deleted_at: null,
        OR: [
          { board_members: { some: { user_id: userId } } },
          ...(projectMember.role === 'ADMIN' ? [{}] : [])
        ]
      },
      include: {
        board_members: { where: { user_id: userId } },
      }
    });

    const mapped = boards.map(b => ({
      ...b,
      my_board_role: b.board_members[0]?.role || (projectMember.role === 'ADMIN' ? 'OWNER' : null),
      board_members: undefined
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
}

export async function getBoardById(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.params.boardId;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          where: { deleted_at: null },
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              where: { deleted_at: null },
              orderBy: { position: 'asc' },
              include: {
                labels: { include: { label: true } },
                assignees: { include: { user: { select: { id: true, username: true, email: true } } } },
              }
            }
          }
        },
        labels: true,
        board_members: { include: { user: { select: { id: true, username: true, email: true } } } },
      }
    });

    if (!board || board.deleted_at) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
    }

    res.json(board);
  } catch (err) {
    next(err);
  }
}

export const updateBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
  }),
});

export async function updateBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.params.boardId;
    const { name, description } = req.body;

    const board = await prisma.board.update({
      where: { id: boardId },
      data: { name, description },
    });

    res.json(board);
  } catch (err) {
    next(err);
  }
}

export async function deleteBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.params.boardId;

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.board.update({
        where: { id: boardId },
        data: { deleted_at: now },
      });
      await tx.column.updateMany({
        where: { board_id: boardId, deleted_at: null },
        data: { deleted_at: now },
      });
      await tx.task.updateMany({
        where: { board_id: boardId, deleted_at: null },
        data: { deleted_at: now },
      });
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
