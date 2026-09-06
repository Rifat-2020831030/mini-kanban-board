import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { computePosition } from '../utils/fractionalIndex';
import { Decimal } from '@prisma/client';
import { io } from '../socket';

export const createSubtaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
  }),
});

export async function createSubtask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;
    const { title } = req.body;

    const lastSubtask = await prisma.subtask.findFirst({
      where: { task_id: taskId },
      orderBy: { position: 'desc' },
    });

    const position = lastSubtask ? lastSubtask.position.plus(1) : new Decimal(1);

    const subtask = await prisma.subtask.create({
      data: { task_id: taskId, title, position },
    });

    const task = (req as any).task;
    io.to(`board:${task.board_id}`).emit('subtask:created', subtask);
    res.status(201).json(subtask);
  } catch (err) {
    next(err);
  }
}

export const updateSubtaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    isCompleted: z.boolean().optional(),
    afterSubtaskId: z.string().uuid().nullable().optional(),
  }),
});

export async function updateSubtask(req: Request, res: Response, next: NextFunction) {
  try {
    const subtaskId = req.params.subtaskId;
    const taskId = req.params.taskId;
    const { title, isCompleted, afterSubtaskId } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (isCompleted !== undefined) data.is_completed = isCompleted;

    if (afterSubtaskId !== undefined) {
      let afterSub = null;
      let beforeSub = null;
      if (afterSubtaskId) {
        afterSub = await prisma.subtask.findUnique({ where: { id: afterSubtaskId } });
        if (!afterSub || afterSub.task_id !== taskId) {
          return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid afterSubtaskId' } });
        }
        beforeSub = await prisma.subtask.findFirst({
          where: { task_id: taskId, id: { not: subtaskId }, position: { gt: afterSub.position } },
          orderBy: { position: 'asc' },
        });
      } else {
        beforeSub = await prisma.subtask.findFirst({
          where: { task_id: taskId, id: { not: subtaskId } },
          orderBy: { position: 'asc' },
        });
      }
      data.position = computePosition(beforeSub?.position || null, afterSub?.position || null);
    }

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data,
    });

    const task = (req as any).task;
    io.to(`board:${task.board_id}`).emit('subtask:updated', subtask);
    res.json(subtask);
  } catch (err) {
    next(err);
  }
}

export async function deleteSubtask(req: Request, res: Response, next: NextFunction) {
  try {
    const subtaskId = req.params.subtaskId;

    await prisma.subtask.delete({ where: { id: subtaskId } });

    const task = (req as any).task;
    io.to(`board:${task.board_id}`).emit('subtask:deleted', { id: subtaskId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
