import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export const addAssigneeSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
  }),
});

export async function addAssignee(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;
    const { userId } = req.body;
    const assignedBy = req.user!.userId;
    
    // Validate target user is on the board
    const task = (req as any).task;
    const isMember = task.board.board_members.some((bm: any) => bm.user_id === userId);
    const isProjectAdmin = task.board.project.project_members.some((pm: any) => pm.user_id === userId && pm.role === 'ADMIN');

    if (!isMember && !isProjectAdmin) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Target user is not a board member' } });
    }

    const assignee = await prisma.taskAssignee.create({
      data: { task_id: taskId, user_id: userId, assigned_by: assignedBy },
    });

    res.status(201).json(assignee);
  } catch (err) {
    next(err);
  }
}

export async function removeAssignee(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId;
    const userId = req.params.userId;

    await prisma.taskAssignee.delete({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
