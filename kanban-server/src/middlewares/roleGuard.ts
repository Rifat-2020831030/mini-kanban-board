import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { BoardRole } from '@prisma/client';

export function requireProjectMember() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const projectId = req.params.projectId || req.body.projectId;

    if (!userId || !projectId) {
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
    const projectId = req.params.projectId || req.body.projectId;

    if (!userId || !projectId) {
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
    const boardId = req.params.boardId || req.body.boardId || req.params.id;

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

    const isBoardMember = board.board_members.length > 0;
    const isProjectAdmin = board.project.project_members.some(pm => pm.role === 'ADMIN');

    if (!isBoardMember && !isProjectAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No access to this board' } });
    }

    (req as any).boardRole = isBoardMember ? board.board_members[0].role : null;
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
    const boardId = req.params.boardId || req.body.boardId;

    if (!userId || !boardId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing user or board ID' } });
    }

    const member = await prisma.boardMember.findUnique({
      where: { board_id_user_id: { board_id: boardId, user_id: userId } },
    });

    // We might also allow project admins here, but usually role checks are specific to board members.
    // If we want project admin to bypass board roles:
    const projectAdmin = await prisma.board.findUnique({
      where: { id: boardId },
      include: { project: { include: { project_members: { where: { user_id: userId, role: 'ADMIN' } } } } }
    }).then(b => b?.project.project_members.length ? true : false);

    if (projectAdmin) {
      return next();
    }

    if (!member) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a board member' } });
    }

    if (roleLevels[member.role] < roleLevels[minRole]) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Require at least ${minRole} role` } });
    }

    (req as any).boardMember = member;
    next();
  };
}

export function requireTaskAccess(action: 'edit' | 'move' | 'delete') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const taskId = req.params.taskId || req.params.id;

    if (!userId || !taskId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing user or task ID' } });
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

    const isProjectAdmin = task.board.project.project_members.some(pm => pm.role === 'ADMIN');
    const boardMember = task.board.board_members[0];
    const role = boardMember?.role;
    const isAssignee = task.assignees.length > 0;

    if (isProjectAdmin) {
      (req as any).task = task;
      return next();
    }

    if (!role) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No access to task' } });
    }

    if (action === 'delete') {
      if (roleLevels[role] < roleLevels.EDITOR) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only OWNER/EDITOR can delete tasks' } });
      }
    } else if (action === 'move') {
      // EDITOR/OWNER can move. MEMBER can move if assignee? Or MEMBER can move any?
      // "updateTask: if requester is a MEMBER role and is an assignee, allow all field updates EXCEPT title → 403 FORBIDDEN."
      // Let's assume EDITOR+ can move, MEMBER can move if they are assignee.
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
