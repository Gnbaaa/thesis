import type { Request, Response } from 'express';
import type { z } from 'zod';
import * as svc from './donations.service';
import * as payments from './payment.adapter';
import type {
  createDonationPostBody,
  donateBody,
  donationPostIdParams,
  updateDonationPostBody,
} from './donations.schema';
import type { DonationPostListQuery } from './donations.types';

type CreateBody = z.infer<typeof createDonationPostBody>;
type UpdateBody = z.infer<typeof updateDonationPostBody>;
type DonateBody = z.infer<typeof donateBody>;
type IdParams = z.infer<typeof donationPostIdParams>;

export async function list(req: Request, res: Response) {
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as DonationPostListQuery;
  const out = await svc.listDonationPosts(q);
  res.json({ ...out, page: q.page, pageSize: q.pageSize });
}

export async function getById(req: Request, res: Response) {
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const out = await svc.getDonationPostById(p.id);
  res.json(out);
}

export async function create(req: Request, res: Response) {
  const userId = req.user!.id;
  const body = req.body as CreateBody;
  const created = await svc.createDonationPost({ ownerId: userId, body });
  res.status(201).json(created);
}

export async function update(req: Request, res: Response) {
  const user = req.user!;
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const body = req.body as UpdateBody;
  const out = await svc.updateDonationPost({ id: p.id, user, body });
  res.json(out);
}

export async function donate(req: Request, res: Response) {
  const user = req.user!;
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as IdParams;
  const body = req.body as DonateBody;
  const out = await svc.initiateDonation({
    postId: p.id,
    donor: { id: user.id, fallbackName: user.email },
    body,
  });
  res.status(201).json(out);
}

/**
 * Stripe webhook handler. server.ts дотор `express.raw({ type: 'application/json' })`-аар
 * холбогдох ба signature шалгалт `payment.adapter.verifyWebhook` дотор хийгдэнэ.
 * Raw body хадгалагдсан байх ёстой — `req.body` нь Buffer байна.
 */
export async function webhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  const sigHeader = Array.isArray(signature) ? signature[0] : signature;
  const event = payments.verifyWebhook(req.body as Buffer, sigHeader);
  await svc.handleStripeEvent(event);
  res.json({ received: true });
}
