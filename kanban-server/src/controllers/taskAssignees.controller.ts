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
    const taskId = req.params.taskId as string;
    const { userId } = req.body;
    const assignedBy = req.user!.userId;
    const task = (req as any).task;

    const boardId = task?.board_id || task?.board?.id;
    const projectId = task?.project_id || task?.board?.project_id;

    // Check if target user is member of board or project
    const [boardMember, projectMember] = await Promise.all([
      boardId ? prisma.boardMember.findUnique({
        where: { board_id_user_id: { board_id: boardId, user_id: userId } }
      }) : null,
      projectId ? prisma.projectMember.findUnique({
        where: { project_id_user_id: { project_id: projectId, user_id: userId } }
      }) : null
    ]);

    if (!boardMember && !projectMember) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Target user is not a project member' } });
    }

    const existingAssignee = await prisma.taskAssignee.findUnique({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } }
    });

    if (existingAssignee) {
      return res.status(409).json({ error: { code: 'ALREADY_ASSIGNED', message: 'User is already assigned to this task' } });
    }

    const assignee = await prisma.taskAssignee.create({
      data: { task_id: taskId, user_id: userId, assigned_by: assignedBy },
      include: { user: { select: { id: true, username: true, email: true } } }
    });

    res.status(201).json(assignee);
  } catch (err) {
    next(err);
  }
}

export async function removeAssignee(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.taskId as string;
    const userId = req.params.userId as string;

    await prisma.taskAssignee.delete({
      where: { task_id_user_id: { task_id: taskId, user_id: userId } },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
