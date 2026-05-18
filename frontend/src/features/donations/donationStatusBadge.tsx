import { Badge } from '@/components/ui/Badge';
import type { DonationPostStatus } from '@/features/donations/donationsApi';
import { donationStatusLabel } from '@/features/donations/donationStatusLabel';

export function DonationStatusBadge({
  status,
  t,
}: {
  status: DonationPostStatus;
  t: (k: string) => string;
}) {
  return <Badge variant={status === 'active' ? 'success' : 'muted'}>{donationStatusLabel(status, t)}</Badge>;
}
