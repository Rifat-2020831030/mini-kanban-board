import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { BoardRole } from '@prisma/client';

export function requireProjectMember() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const projectId = (req.params.projectId || req.body.projectId) as string;

    if (!userId || !projectId || projectId === 'undefined') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing user or project ID' } });
    }

    const member = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
    });

    if (!member) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a project member' } });
    }

    // Pass the member info down if needed
    (req as any).projectMember = member;
    next();
  };
}

export function requireProjectAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const projectId = (req.params.projectId || req.body.projectId) as string;

    if (!userId || !projectId || projectId === 'undefined') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing user or project ID' } });
    }

    const member = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Require project admin role' } });
    }

    next();
  };
}

export function requireBoardAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const boardId = (req.params.boardId || req.body.boardId || req.params.id) as string;

    if (!userId || !boardId || boardId === 'undefined') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing user or board ID' } });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        board_members: { where: { user_id: userId } },
        project: { include: { project_members: { where: { user_id: userId } } } }
      }
    });

    if (!board) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
    }

    const isBoardMember = board.board_members.length > 0;
    const isProjectMember = board.project.project_members.length > 0;
    const isProjectAdmin = board.project.project_members.some(pm => pm.role === 'ADMIN');

    if (!isBoardMember && !isProjectMember) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No access to this board' } });
    }

    (req as any).boardRole = isBoardMember ? board.board_members[0].role : (isProjectAdmin ? 'OWNER' : 'MEMBER');
    (req as any).isProjectAdmin = isProjectAdmin;
    (req as any).board = board;
    next();
  };
}

const roleLevels: Record<BoardRole, number> = {
  OWNER: 3,
  EDITOR: 2,
  MEMBER: 1,
};

export function requireBoardRole(minRole: BoardRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const boardId = (req.params.boardId || req.body.boardId) as string;

    if (!userId || !boardId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing user or board ID' } });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        board_members: { where: { user_id: userId } },
        project: { include: { project_members: { where: { user_id: userId } } } }
      }
    });

    if (!board) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
    }

    const isProjectAdmin = board.project.project_members.some(pm => pm.role === 'ADMIN');
    const member = board.board_members[0];

    (req as any).board = board;
    (req as any).isProjectAdmin = isProjectAdmin;

    if (isProjectAdmin) {
      (req as any).boardRole = 'OWNER';
      return next();
    }

    if (!member) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a board member' } });
    }

    if (roleLevels[member.role] < roleLevels[minRole]) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Require at least ${minRole} role` } });
    }

    (req as any).boardRole = member.role;
    (req as any).boardMember = member;
    next();
  };
}

export function requireTaskAccess(action: 'view' | 'edit' | 'move' | 'delete') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const taskId = (req.params.taskId || req.params.id) as string;

    if (!userId || !taskId || taskId === 'undefined') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing or invalid task ID' } });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: {
          include: {
            board_members: { where: { user_id: userId } },
            project: { include: { project_members: { where: { user_id: userId } } } }
          }
        },
        assignees: { where: { user_id: userId } }
      }
    });

    if (!task) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const isProjectMember = task.board.project.project_members.length > 0;
    const isProjectAdmin = task.board.project.project_members.some(pm => pm.role === 'ADMIN');
    const boardMember = task.board.board_members[0];
    const role = boardMember?.role || (isProjectAdmin ? 'OWNER' : (isProjectMember ? 'MEMBER' : null));
    const isAssignee = task.assignees.length > 0;

    if (isProjectAdmin) {
      (req as any).task = task;
      (req as any).boardRole = 'OWNER';
      (req as any).isAssignee = isAssignee;
      return next();
    }

    if (!role) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No access to task' } });
    }

    if (action === 'view') {
      (req as any).task = task;
      (req as any).boardRole = role;
      (req as any).isAssignee = isAssignee;
      return next();
    }

    if (action === 'delete') {
      if (roleLevels[role] < roleLevels.EDITOR) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only OWNER/EDITOR can delete tasks' } });
      }
    } else if (action === 'move') {
      if (roleLevels[role] < roleLevels.EDITOR && !isAssignee) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only EDITOR+ or Assignee can move tasks' } });
      }
    } else if (action === 'edit') {
      if (roleLevels[role] < roleLevels.EDITOR && !isAssignee) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only EDITOR+ or Assignee can edit tasks' } });
      }
    }

    (req as any).task = task;
    (req as any).boardRole = role;
    (req as any).isAssignee = isAssignee;
    next();
  };
}
