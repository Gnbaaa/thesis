import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as svc from './volunteer.service';
import type {
  createVolunteerPostBody,
  updateVolunteerPostBody,
  volunteerPostIdParams,
} from './volunteer.schema';
import type { VolunteerPostListQuery } from './volunteer.types';

type CreateBody = z.infer<typeof createVolunteerPostBody>;
type UpdateBody = z.infer<typeof updateVolunteerPostBody>;
type IdParams = z.infer<typeof volunteerPostIdParams>;

export async function list(req: Request, res: Response) {
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as VolunteerPostListQuery;
  const out = await svc.listVolunteerPosts(q);
  res.json({ ...out, page: q.page, pageSize: q.pageSize });
}

export async function getById(req: Request, res: Response) {
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const viewerId = req.user?.id ?? null;
  const out = await svc.getVolunteerPostById(p.id, viewerId);
  res.json(out);
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.id;
  const body = req.body as CreateBody;
  const created = await svc.createVolunteerPost({ ownerId: userId, body });
  res.status(201).json(created);
}

export async function update(req: Request, res: Response) {
  const user = req.user!;
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const body = req.body as UpdateBody;
  const out = await svc.updateVolunteerPost({ id: p.id, user, body });
  res.json(out);
}

export async function register(req: Request, res: Response) {
  const userId = req.user!.id;
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const out = await svc.registerForVolunteerPost({ postId: p.id, userId });
  res.status(201).json(out);
}

export async function unregister(req: Request, res: Response) {
  const userId = req.user!.id;
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const out = await svc.unregisterFromVolunteerPost({ postId: p.id, userId });
  res.json(out);
}
