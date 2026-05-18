import type { VolunteerPostStatus } from '@/features/volunteer/volunteerApi';

export function volunteerStatusLabel(status: VolunteerPostStatus, t: (k: string) => string): string {
  return status === 'active' ? t('volunteer.status.active') : t('volunteer.status.completed');
}
