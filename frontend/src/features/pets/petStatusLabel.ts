import type { PetStatus } from '@/features/pets/petsApi';

export function petStatusLabel(status: PetStatus, t: (k: string) => string): string {
  return status === 'available'
    ? t('pets.status.available')
    : status === 'pending'
      ? t('pets.status.pending')
      : t('pets.status.adopted');
}
