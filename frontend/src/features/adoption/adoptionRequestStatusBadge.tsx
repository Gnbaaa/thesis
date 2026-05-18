import { Badge } from '@/components/ui/Badge';
import type { AdoptionRequestStatus } from '@/features/adoption/inboxApi';
import { adoptionRequestStatusLabel } from '@/features/adoption/adoptionRequestStatusLabel';

export function AdoptionRequestStatusBadge({
  status,
  t,
}: {
  status: AdoptionRequestStatus;
  t: (k: string) => string;
}) {
  const variant =
    status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';
  return <Badge variant={variant}>{adoptionRequestStatusLabel(status, t)}</Badge>;
}
