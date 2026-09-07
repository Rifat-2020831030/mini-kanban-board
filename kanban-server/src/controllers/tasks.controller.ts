import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { computePosition } from '../utils/fractionalIndex';
import { Prisma } from '@prisma/client';
import { io } from '../socket';
import { Priority } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    columnId: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
    assigneeIds: z.array(z.string().uuid()).optional(),
    labelIds: z.array(z.string().uuid()).optional(),
  }),
});

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = (req.params.boardId as string) as string;
    const { columnId, title, description, dueDate, priority, assigneeIds, labelIds } = req.body;
    const userId = req.user!.userId;
    const boardRole = (req as any).boardRole;
    const board = (req as any).board;

    const column = await prisma.column.findUnique({ where: { id: columnId } });
    if (!column || column.board_id !== boardId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid columnId' } });
    }

    const lastTask = await prisma.task.findFirst({
      where: { column_id: columnId, deleted_at: null },
      orderBy: { position: 'desc' },
    });
    const position = lastTask ? lastTask.position.plus(1) : new Prisma.Decimal(1);

    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: {
          column_id: columnId,
          board_id: boardId,
          project_id: board.project_id,
          created_by: userId,
          title,
          description,
          due_date: dueDate ? new Date(dueDate) : null,
          priority: (priority as Priority) || 'NONE',
          position,
        },
      });

      if (assigneeIds && assigneeIds.length > 0) {
        for (const aId of assigneeIds) {
          await tx.taskAssignee.create({
            data: { task_id: t.id, user_id: aId, assigned_by: userId },
          });
        }
      } else if (boardRole === 'MEMBER') {
        await tx.taskAssignee.create({
          data: { task_id: t.id, user_id: userId, assigned_by: userId },
        });
      }

      if (labelIds && labelIds.length > 0) {
        for (const lId of labelIds) {
          await tx.taskLabel.create({
            data: { task_id: t.id, label_id: lId },
          });
        }
      }

      await tx.taskLifecycleEvent.create({
        data: { task_id: t.id, user_id: userId, action_type: 'CREATED', to_column_id: columnId },
      });

      return tx.task.findUnique({
        where: { id: t.id },
        include: {
          subtasks: { orderBy: { position: 'asc' } },
          labels: { include: { label: true } },
          assignees: { include: { user: { select: { id: true, username: true, email: true } } } },
        }
      });
    });

    io.to(`board:${boardId}`).emit('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = (req.params.taskId as string) as string;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        subtasks: { orderBy: { position: 'asc' } },
        labels: { include: { label: true } },
        assignees: { include: { user: { select: { id: true, username: true, email: true } } } },
      }
    });
    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  }),
});

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = (req.params.taskId as string);
    const { title, description, dueDate, priority } = req.body;
    const boardRole = (req as any).boardRole;
    const isAssignee = (req as any).isAssignee;

    if (boardRole === 'MEMBER' && isAssignee && title !== undefined) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'MEMBER cannot update title' } });
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (dueDate !== undefined) data.due_date = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) data.priority = priority;

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    io.to(`board:${task.board_id}`).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export const moveTaskSchema = z.object({
  body: z.object({
    toColumnId: z.string().uuid(),
    afterTaskId: z.string().uuid().nullable(),
  }),
});

export async function moveTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = (req.params.taskId as string);
    const boardId = (req.params.boardId as string);
    const { toColumnId, afterTaskId } = req.body;
    const userId = req.user!.userId;
    const currentTask = (req as any).task;

    const toColumn = await prisma.column.findUnique({ where: { id: toColumnId } });
    if (!toColumn || toColumn.board_id !== boardId) {
      return res.status(400).json({ error: { code: 'CROSS_BOARD_MOVE_NOT_ALLOWED', message: 'Cannot move to column in different board' } });
    }

    let afterTask = null;
    let nextTask = null;

    if (afterTaskId) {
      afterTask = await prisma.task.findUnique({ where: { id: afterTaskId } });
      if (!afterTask || afterTask.column_id !== toColumnId) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid afterTaskId' } });
      }
      nextTask = await prisma.task.findFirst({
        where: {
          column_id: toColumnId,
          position: { gt: afterTask.position },
          deleted_at: null,
          id: { not: taskId as string },
        },
        orderBy: { position: 'asc' },
      });
    } else {
      nextTask = await prisma.task.findFirst({
        where: {
          column_id: toColumnId,
          deleted_at: null,
          id: { not: taskId as string },
        },
        orderBy: { position: 'asc' },
      });
    }

    const newPos = computePosition(afterTask?.position || null, nextTask?.position || null);

    const task = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id: taskId as string },
        data: { column_id: toColumnId, position: newPos },
      });

      await tx.taskLifecycleEvent.create({
        data: {
          task_id: taskId,
          user_id: userId,
          action_type: 'MOVED',
          from_column_id: currentTask.column_id,
          to_column_id: toColumnId,
        },
      });

      return t;
    });

    io.to(`board:${boardId}`).emit('task:moved', task);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = (req.params.taskId as string);

    await prisma.task.update({
      where: { id: taskId },
      data: { deleted_at: new Date() },
    });

    const task = (req as any).task;
    io.to(`board:${task.board_id}`).emit('task:deleted', { id: taskId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getTaskLifecycle(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = (req.params.taskId as string);

    const events = await prisma.taskLifecycleEvent.findMany({
      where: { task_id: taskId },
      orderBy: { created_at: 'asc' },
      include: {
        user: { select: { id: true, username: true } },
        from_column: { select: { id: true, name: true } },
        to_column: { select: { id: true, name: true } },
      }
    });

    res.json(events);
  } catch (err) {
    next(err);
  }
}
