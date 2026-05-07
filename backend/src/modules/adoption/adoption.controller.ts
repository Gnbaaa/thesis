import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { createAdoptionRequestBody, inboxQuery, requestIdParams, resolveBody } from './adoption.schema';
import * as svc from './adoption.service';

type CreateBody = z.infer<typeof createAdoptionRequestBody>;
type InboxQuery = z.infer<typeof inboxQuery>;
type IdParams = z.infer<typeof requestIdParams>;
type ResolveBody = z.infer<typeof resolveBody>;

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CreateBody;
    const requesterId = req.user!.id;
    const created = await svc.createRequest({
      petId: body.petId,
      requesterId,
      reason: body.reason,
      livingEnvironment: body.livingEnvironment,
      hasOwnedPetBefore: body.hasOwnedPetBefore,
      householdSize: typeof body.householdSize === 'number' ? body.householdSize : null,
      contactPhone: body.contactPhone?.trim() ? body.contactPhone.trim() : null,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function inbox(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as InboxQuery;
    const ownerId = req.user!.id;
    const out = await svc.getInbox({ ownerId, limit: q.limit });
    res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function myRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as InboxQuery;
    const requesterId = req.user!.id;
    const out = await svc.getMyRequests({ requesterId, limit: q.limit });
    res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
    const ownerId = req.user!.id;
    const out = await svc.getRequestDetail({ requestId: p.id, ownerId });
    res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function resolve(req: Request, res: Response, next: NextFunction) {
  try {
    const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
    const body = req.body as ResolveBody;
    const ownerId = req.user!.id;
    const out = await svc.resolveRequest({ requestId: p.id, ownerId, action: body.action });
    res.json(out);
  } catch (err) {
    next(err);
  }
}

