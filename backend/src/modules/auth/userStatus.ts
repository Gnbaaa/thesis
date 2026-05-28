import { ForbiddenError } from '../../shared/errors';

export type UserAccountStatus = 'active' | 'suspended' | 'closed';

export function normaliseUserStatus(raw: string | null | undefined): UserAccountStatus {
  if (raw === 'suspended' || raw === 'closed') return raw;
  return 'active';
}



export function assertUserMayAuthenticate(status: UserAccountStatus): void {
  if (status === 'suspended') {
    throw new ForbiddenError(
      'Таны бүртгэл түр түдгэлзсэн байна. Админтай холбогдоно уу.',
      'USER_SUSPENDED',
    );
  }
  if (status === 'closed') {
    throw new ForbiddenError(
      'Таны бүртгэл хаагдсан байна. Дахин нэвтрэх боломжгүй.',
      'USER_ACCOUNT_CLOSED',
    );
  }
}
