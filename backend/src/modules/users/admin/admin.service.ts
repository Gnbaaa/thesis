import { ForbiddenError, NotFoundError } from '../../../shared/errors';
import { logger } from '../../../shared/logger';
import * as repo from './admin.repository';
import type {
  AdminUserListQuery,
  AdminUserListResult,
  UserRole,
  UserStatus,
} from './admin.types';

export async function listUsers(query: AdminUserListQuery): Promise<AdminUserListResult> {
  return await repo.listAdminUsers(query);
}

/**
 * UC-011: Admin нь хэрэглэгчийн дүрийг өөрчилнө.
 * - Өөрийгөө demote хийхээс хамгаалах (admin → user/ngo) — тогтолцоог админгүй болгохгүй.
 * - Аудит логийг хадгална.
 */
export async function setUserRole(params: {
  adminId: string;
  targetId: string;
  role: UserRole;
}) {
  if (params.adminId === params.targetId) {
    throw new ForbiddenError(
      'Өөрийнхөө эрхийг өөрчлөх боломжгүй.',
      'ADMIN_CANNOT_MODIFY_SELF',
    );
  }
  const existing = await repo.findAdminUserById(params.targetId);
  if (!existing) {
    throw new NotFoundError('Хэрэглэгч олдсонгүй', 'USER_NOT_FOUND');
  }
  const result = await repo.updateUserRole(params.targetId, params.role);
  logger.info(
    { adminId: params.adminId, targetId: params.targetId, before: existing.role, after: params.role },
    'admin.user_role_changed',
  );
  if (!result.updated) {
    throw new NotFoundError('Хэрэглэгч олдсонгүй', 'USER_NOT_FOUND');
  }
  return await repo.findAdminUserById(params.targetId);
}

/**
 * UC-011: Admin нь хэрэглэгчийн төлвийг өөрчилнө (түдгэлзүүлэх / хаах / сэргээх).
 */
export async function setUserStatus(params: {
  adminId: string;
  targetId: string;
  status: UserStatus;
}) {
  if (params.adminId === params.targetId) {
    throw new ForbiddenError(
      'Өөрийн төлөвийг өөрчлөх боломжгүй.',
      'ADMIN_CANNOT_MODIFY_SELF',
    );
  }
  const existing = await repo.findAdminUserById(params.targetId);
  if (!existing) {
    throw new NotFoundError('Хэрэглэгч олдсонгүй', 'USER_NOT_FOUND');
  }
  const result = await repo.updateUserStatus(params.targetId, params.status);
  logger.info(
    {
      adminId: params.adminId,
      targetId: params.targetId,
      before: existing.status,
      after: params.status,
    },
    'admin.user_status_changed',
  );
  if (!result.updated) {
    throw new NotFoundError('Хэрэглэгч олдсонгүй', 'USER_NOT_FOUND');
  }
  return await repo.findAdminUserById(params.targetId);
}
