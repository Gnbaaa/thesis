import type { Request, Response } from 'express';
import * as donationsSvc from '../../donations/donations.service';
import * as petsSvc from '../../pets/pets.service';
import * as volunteerSvc from '../../volunteer/volunteer.service';
import type { ReportsQuery } from './reports.schema';

export async function getReports(req: Request, res: Response) {
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as ReportsQuery;
  const ownerId = req.user!.id;
  const range = q.from || q.to ? { from: q.from, to: q.to } : undefined;
  const [donations, pets, volunteer] = await Promise.all([
    donationsSvc.getOwnerActivityReport(ownerId, range),
    petsSvc.getOwnerActivityReport(ownerId, range),
    volunteerSvc.getOwnerActivityReport(ownerId, range),
  ]);
  res.json({ donations, pets, volunteer });
}
