import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export async function listLabels(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.params.boardId;
    const labels = await prisma.label.findMany({ where: { board_id: boardId } });
    res.json(labels);
  } catch (err) {
    next(err);
  }
}

export const createLabelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    color: z.string().min(1).max(50),
  }),
});

export async function createLabel(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.params.boardId;
    const { name, color } = req.body;

    const label = await prisma.label.create({
      data: { board_id: boardId, name, color },
    });

    res.status(201).json(label);
  } catch (err) {
    next(err);
  }
}

export const updateLabelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    color: z.string().min(1).max(50).optional(),
  }),
});

export async function updateLabel(req: Request, res: Response, next: NextFunction) {
  try {
    const labelId = req.params.labelId;
    const { name, color } = req.body;

    const label = await prisma.label.update({
      where: { id: labelId },
      data: { name, color },
    });

    res.json(label);
  } catch (err) {
    next(err);
  }
}

export async function deleteLabel(req: Request, res: Response, next: NextFunction) {
  try {
    const labelId = req.params.labelId;

    await prisma.label.delete({ where: { id: labelId } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export const tagTaskSchema = z.object({
  body: z.object({
    labelId: z.string().uuid(),
  }),
});

export async function tagTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;
    const { labelId } = req.body;

    const tag = await prisma.taskLabel.create({
      data: { task_id: taskId, label_id: labelId },
    });

    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
}

export async function untagTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;
    const labelId = req.params.labelId;

    await prisma.taskLabel.delete({
      where: { task_id_label_id: { task_id: taskId, label_id: labelId } },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
