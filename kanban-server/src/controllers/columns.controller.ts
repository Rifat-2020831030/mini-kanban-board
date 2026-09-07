import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { computePosition } from '../utils/fractionalIndex';
import { Prisma } from '@prisma/client';
import { io } from '../socket';

export const createColumnSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
  }),
});

export const bulkCreateColumnSchema = z.object({
  body: z.object({
    names: z.array(z.string().min(1).max(255)).min(1),
  }),
});

export async function createColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = (req.params.boardId as string);
    const { name } = req.body;

    const lastCol = await prisma.column.findFirst({
      where: { board_id: boardId, deleted_at: null },
      orderBy: { position: 'desc' },
    });

    const position = lastCol ? lastCol.position.plus(1) : new Prisma.Decimal(1);

    const column = await prisma.column.create({
      data: { board_id: boardId, name, position },
    });

    io.to(`board:${boardId}`).emit('column:created', column);
    res.status(201).json(column);
  } catch (err) {
    next(err);
  }
}

export async function bulkCreateColumns(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = (req.params.boardId as string);
    const { names } = req.body;

    const lastCol = await prisma.column.findFirst({
      where: { board_id: boardId, deleted_at: null },
      orderBy: { position: 'desc' },
    });

    let currentPosition = lastCol ? lastCol.position : new Prisma.Decimal(0);

    const columns = await prisma.$transaction(async (tx) => {
      const createdColumns = [];
      for (const name of names) {
        currentPosition = currentPosition.plus(1);
        const col = await tx.column.create({
          data: { board_id: boardId, name, position: currentPosition },
        });
        createdColumns.push(col);
      }
      return createdColumns;
    });

    io.to(`board:${boardId}`).emit('columns:created', columns);
    res.status(201).json(columns);
  } catch (err) {
    next(err);
  }
}

export const renameColumnSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
  }),
});

export async function renameColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const columnId = (req.params.columnId as string);
    const { name } = req.body;

    const column = await prisma.column.update({
      where: { id: columnId },
      data: { name },
    });

    io.to(`board:${column.board_id}`).emit('column:renamed', column);
    res.json(column);
  } catch (err) {
    next(err);
  }
}

export const moveColumnSchema = z.object({
  body: z.object({
    afterColumnId: z.string().uuid().nullable(),
  }),
});

export async function moveColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const columnId = (req.params.columnId as string);
    const boardId = (req.params.boardId as string);
    const { afterColumnId } = req.body;

    let afterCol = null;
    let nextCol = null;

    if (afterColumnId) {
      afterCol = await prisma.column.findUnique({ where: { id: afterColumnId as string } });
      if (!afterCol || afterCol.board_id !== boardId) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid afterColumnId' } });
      }
      nextCol = await prisma.column.findFirst({
        where: {
          board_id: boardId as string,
          position: { gt: afterCol.position },
          deleted_at: null,
          id: { not: columnId as string },
        },
        orderBy: { position: 'asc' },
      });
    } else {
      nextCol = await prisma.column.findFirst({
        where: {
          board_id: boardId as string,
          deleted_at: null,
          id: { not: columnId as string },
        },
        orderBy: { position: 'asc' },
      });
    }

    const newPos = computePosition(afterCol?.position || null, nextCol?.position || null);

    const column = await prisma.column.update({
      where: { id: columnId as string },
      data: { position: newPos },
    });

    io.to(`board:${boardId}`).emit('column:moved', column);
    res.json(column);
  } catch (err) {
    next(err);
  }
}

export async function deleteColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const columnId = (req.params.columnId as string);

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.column.update({
        where: { id: columnId },
        data: { deleted_at: now },
      });
      await tx.task.updateMany({
        where: { column_id: columnId, deleted_at: null },
        data: { deleted_at: now },
      });
    });

    // Need to get board_id to emit
    const col = await prisma.column.findUnique({ where: { id: columnId } });
    if (col) {
      io.to(`board:${col.board_id}`).emit('column:deleted', { id: columnId });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
