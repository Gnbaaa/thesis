import type { Request, Response } from 'express';
import { ValidationError } from '../../../shared/errors';
import * as svc from './admin.service';
import type { AdminUserListQuery, UserRole, UserStatus } from './admin.types';

export async function listUsers(req: Request, res: Response) {
  const vq = (req as Request & { validatedQuery?: unknown }).validatedQuery as AdminUserListQuery;
  const out = await svc.listUsers(vq);
  res.json(out);
}

function getIdParam(req: Request): string {
  const raw = req.params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) throw new ValidationError('ID шаардлагатай');
  return id;
}

export async function updateRole(req: Request, res: Response) {
  const adminId = req.user!.id;
  const targetId = getIdParam(req);
  const body = req.body as { role: UserRole };
  const updated = await svc.setUserRole({ adminId, targetId, role: body.role });
  res.json({ user: updated });
}

export async function updateStatus(req: Request, res: Response) {
  const adminId = req.user!.id;
  const targetId = getIdParam(req);
  const body = req.body as { status: UserStatus };
  const updated = await svc.setUserStatus({ adminId, targetId, status: body.status });
  res.json({ user: updated });
}
