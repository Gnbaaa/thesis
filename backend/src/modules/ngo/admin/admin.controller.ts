import type { Request, Response } from 'express';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors';
import { getImageUrl, getRawUrl } from '../../../shared/storage';
import * as notificationsService from '../../notifications/notifications.service';
import type { NgoApplication, NgoApplicationStatus } from '../ngo.types';
import * as repo from './admin.repository';

export async function listApplications(req: Request, res: Response) {
  const vq = (req as Request & { validatedQuery?: unknown }).validatedQuery as {
    q?: string;
    status?: NgoApplicationStatus;
    page: number;
    pageSize: number;
  };
  const { q, status, page, pageSize } = vq;

  const out = await repo.listApplications({ q, status, page, pageSize });
  res.json({ ...out, page, pageSize });
}

function withDocumentUrl(app: NgoApplication): NgoApplication {
  const resourceType = app.documentResourceType ?? 'raw';
  const url =
    resourceType === 'image' ? getImageUrl(app.documentPublicId, { width: 1600 }) : getRawUrl(app.documentPublicId);
  return { ...app, documentUrl: url };
}

export async function getApplication(req: Request, res: Response) {
  const idRaw = req.params.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  if (!id) throw new ValidationError('ID шаардлагатай');
  const app = await repo.getApplicationById(id);
  if (!app) throw new NotFoundError('Хүсэлт олдсонгүй', 'NGO_APPLICATION_NOT_FOUND');
  res.json({ application: withDocumentUrl(app) });
}

export async function updateStatus(req: Request, res: Response) {
  const idRaw = req.params.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  if (!id) throw new ValidationError('ID шаардлагатай');
  const body = req.body as { status: NgoApplicationStatus; note?: string };
  const updated = await repo.updateApplicationStatus({
    id,
    status: body.status,
    reviewedBy: req.user!.id,
    note: body.note,
  });
  if (!updated) {
    throw new ConflictError('Энэ хүсэлт аль хэдийн шийдвэрлэгдсэн эсвэл олдсонгүй', 'NGO_APPLICATION_NOT_PENDING');
  }

  if (body.status === 'approved') {
    await notificationsService.notifySafe({
      userId: updated.userId,
      type: 'ngo_application_approved',
      title: 'ТББ-ийн бүртгэл батлагдлаа',
      body: `«${updated.orgName}» байгууллагын ТББ-ийн эрх идэвхжлээ. Одоо зар нэмж болно.`,
      actionLabel: 'Самбар',
      actionUrl: '/dashboard',
      sourceId: `ngo_application:${updated.id}:approved`,
    });
  } else if (body.status === 'rejected') {
    const note = body.note?.trim();
    await notificationsService.notifySafe({
      userId: updated.userId,
      type: 'ngo_application_rejected',
      title: 'ТББ-ийн хүсэлт татгалзлаа',
      body: note
        ? `«${updated.orgName}»-ийн хүсэлт татгалзлаа. Тайлбар: ${note}`
        : `«${updated.orgName}»-ийн ТББ-ийн хүсэлт татгалзлаа.`,
      actionLabel: 'Дахин илгээх',
      actionUrl: '/ngo/apply',
      sourceId: `ngo_application:${updated.id}:rejected`,
    });
  }

  res.json({ application: withDocumentUrl(updated) });
}

