import type { AdoptionRequestStatus } from '@/features/adoption/inboxApi';

export function adoptionRequestStatusLabel(
  status: AdoptionRequestStatus,
  t: (k: string) => string,
): string {
  if (status === 'approved') return t('dashboard.incoming.status.approved');
  if (status === 'rejected') return t('dashboard.incoming.status.rejected');
  return t('dashboard.incoming.status.pending');
}
