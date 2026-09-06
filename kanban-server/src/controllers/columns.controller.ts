import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { computePosition } from '../utils/fractionalIndex';
import { Decimal } from '@prisma/client';
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
    const boardId = req.params.boardId;
    const { name } = req.body;

    const lastCol = await prisma.column.findFirst({
      where: { board_id: boardId, deleted_at: null },
      orderBy: { position: 'desc' },
    });

    const position = lastCol ? lastCol.position.plus(1) : new Decimal(1);

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
    const boardId = req.params.boardId;
    const { names } = req.body;

    const lastCol = await prisma.column.findFirst({
      where: { board_id: boardId, deleted_at: null },
      orderBy: { position: 'desc' },
    });

    let currentPosition = lastCol ? lastCol.position : new Decimal(0);

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
    const columnId = req.params.columnId;
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
    const columnId = req.params.columnId;
    const boardId = req.params.boardId;
    const { afterColumnId } = req.body;

    let afterCol = null;
    let beforeCol = null;

    if (afterColumnId) {
      afterCol = await prisma.column.findUnique({ where: { id: afterColumnId } });
      if (!afterCol || afterCol.board_id !== boardId) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid afterColumnId' } });
      }
      beforeCol = await prisma.column.findFirst({
        where: { board_id: boardId, position: { gt: afterCol.position }, deleted_at: null },
        orderBy: { position: 'asc' },
      });
    } else {
      beforeCol = await prisma.column.findFirst({
        where: { board_id: boardId, deleted_at: null },
        orderBy: { position: 'asc' },
      });
    }

    const newPos = computePosition(beforeCol?.position || null, afterCol?.position || null);

    const column = await prisma.column.update({
      where: { id: columnId },
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
    const columnId = req.params.columnId;

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
