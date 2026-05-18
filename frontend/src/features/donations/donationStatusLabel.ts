import type { DonationPostStatus } from '@/features/donations/donationsApi';

export function donationStatusLabel(status: DonationPostStatus, t: (k: string) => string): string {
  return status === 'active' ? t('donations.status.active') : t('donations.status.completed');
}
