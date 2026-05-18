import { Badge } from '@/components/ui/Badge';
import type { VolunteerPostStatus } from '@/features/volunteer/volunteerApi';
import { volunteerStatusLabel } from '@/features/volunteer/volunteerStatusLabel';

export function VolunteerStatusBadge({
  status,
  t,
}: {
  status: VolunteerPostStatus;
  t: (k: string) => string;
}) {
  return <Badge variant={status === 'active' ? 'success' : 'muted'}>{volunteerStatusLabel(status, t)}</Badge>;
}
