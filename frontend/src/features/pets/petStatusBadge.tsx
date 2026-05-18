import { Badge } from '@/components/ui/Badge';
import type { PetStatus } from '@/features/pets/petsApi';
import { petStatusLabel } from '@/features/pets/petStatusLabel';

export function PetStatusBadge({ status, t }: { status: PetStatus; t: (k: string) => string }) {
  const variant = status === 'available' ? 'success' : status === 'pending' ? 'warning' : 'muted';
  return <Badge variant={variant}>{petStatusLabel(status, t)}</Badge>;
}
