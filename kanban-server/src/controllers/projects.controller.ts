import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
  }),
});

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;

    // Check if user is already in a project
    const existing = await prisma.projectMember.count({
      where: { user_id: userId },
    });

    if (existing > 0) {
      return res.status(409).json({ error: { code: 'ALREADY_IN_PROJECT', message: 'User already belongs to a project' } });
    }

    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: { name, description, created_by: userId },
      });
      await tx.projectMember.create({
        data: { project_id: p.id, user_id: userId, role: 'ADMIN' },
      });
      return p;
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

export async function getMyProject(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const member = await prisma.projectMember.findFirst({
      where: { user_id: userId },
      include: { project: true },
    });

    if (!member) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No project found' } });
    }

    res.json(member.project);
  } catch (err) {
    next(err);
  }
}

export async function listMyProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const members = await prisma.projectMember.findMany({
      where: { user_id: userId },
      include: { project: true },
    });

    const projects = members.map(m => m.project);
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
  }),
});

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = (req.params.projectId as string) as string;
    const { name, description } = req.body;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
    });

    res.json(project);
  } catch (err) {
    next(err);
  }
}
