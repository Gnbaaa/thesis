import type { Request, Response } from 'express';
import * as donationsSvc from '../../donations/donations.service';
import * as petsSvc from '../../pets/pets.service';
import * as volunteerSvc from '../../volunteer/volunteer.service';

/**
 * UC-014: Үйл ажиллагааны тайлан.
 *
 * Нэвтэрсэн хэрэглэгчийн өөрийн зарууд (амьтны, хандивын, сайн дурын) дээрх
 * статистик болон сүүлийн идэвхийг хамтад нь буцаана. Frontend нь нэг хүсэлтээр
 * гурван tab-ын мэдээллийг авч cache-лнэ.
 *
 * Архитектурын дагуу энэхүү controller нь өөрийн модулийн дотоод хүснэгтэд
 * шууд хандахгүй — гурван өмчилөгч модулийн `service`-ээр дамжуулан мэдээллийг
 * хүлээж авна.
 */
export async function getReports(req: Request, res: Response) {
  const ownerId = req.user!.id;
  const [donations, pets, volunteer] = await Promise.all([
    donationsSvc.getOwnerActivityReport(ownerId),
    petsSvc.getOwnerActivityReport(ownerId),
    volunteerSvc.getOwnerActivityReport(ownerId),
  ]);
  res.json({ donations, pets, volunteer });
}
