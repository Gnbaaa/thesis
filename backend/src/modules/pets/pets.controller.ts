import type { Request, Response } from 'express';
import type { z } from 'zod';
import { createPetBody, petIdParams, updatePetBody } from './pets.schema';
import type { PetListQuery } from './pets.types';
import * as svc from './pets.service';

type CreateBody = z.infer<typeof createPetBody>;
type UpdateBody = z.infer<typeof updatePetBody>;
type IdParams = z.infer<typeof petIdParams>;

export async function list(req: Request, res: Response) {
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as PetListQuery;
  const out = await svc.listPets(q);
  res.json({ ...out, page: q.page, pageSize: q.pageSize });
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.id;
  const body = req.body as CreateBody;
  const created = await svc.createPet({ ownerId: userId, ownerRole: req.user!.role, body });
  res.status(201).json(created);
}

export async function getById(req: Request, res: Response) {
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const out = await svc.getPetByIdForViewer({ petId: p.id, viewerId: req.user?.id ?? null });
  res.json(out);
}

export async function update(req: Request, res: Response) {
  const userId = req.user!.id;
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const body = req.body as UpdateBody;
  const out = await svc.updatePet({ petId: p.id, ownerId: userId, body });
  res.json(out);
}

export async function remove(req: Request, res: Response) {
  const userId = req.user!.id;
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  await svc.deletePet({ petId: p.id, ownerId: userId });
  res.status(204).send();
}

