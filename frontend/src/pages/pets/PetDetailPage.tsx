import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deletePet, getPet, type PetDetail, type PetSpecies } from '@/features/pets/petsApi';
import { PetStatusBadge } from '@/features/pets/petStatusBadge';
import { petStatusLabel } from '@/features/pets/petStatusLabel';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getAuthUserId, useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

function speciesLabel(species: PetSpecies, t: (k: string) => string) {
  return species === 'dog'
    ? t('pets.species.dog')
    : species === 'cat'
      ? t('pets.species.cat')
      : t('pets.species.other');
}

function formatDateYYYYMMDD(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function healthSummary(p: Pick<PetDetail, 'vaccinated' | 'neutered' | 'spayed'>, t: (k: string) => string): string {
  const parts = [
    p.vaccinated ? t('pets.detail.health.vaccinated') : null,
    p.neutered ? t('pets.detail.health.neutered') : null,
    p.spayed ? t('pets.detail.health.spayed') : null,
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(', ') : t('pets.detail.health.none');
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-card px-5 py-3 last:border-b-0">
      <span className="text-[13px] text-text-muted">{label}</span>
      <span className="text-[13px] font-medium text-text">{value}</span>
    </div>
  );
}

export default function PetDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = useIsLoggedIn();
  const { id } = useParams();

  const petId = typeof id === 'string' ? id : '';
  const [deleteOpen, setDeleteOpen] = useState(false);
  const query = useQuery({
    queryKey: ['pets', 'detail', petId],
    queryFn: () => getPet(petId),
    enabled: Boolean(petId),
  });

  const data = query.data;
  const title = data?.name ?? t('pets.detail.title');
  const isOwnListing = Boolean(data?.owner?.id && getAuthUserId() && data.owner.id === getAuthUserId());

  const deleteMutation = useMutation({
    mutationFn: () => deletePet(petId),
    onSuccess: () => {
      setDeleteOpen(false);
      navigate('/pets');
    },
  });

  const startChat = (ownerId: string) => {
    const chatPath = `/chat?to=${encodeURIComponent(ownerId)}`;
    if (!loggedIn) {
      navigate(`/login?next=${encodeURIComponent(chatPath)}`);
      return;
    }
    navigate(chatPath);
  };

  const info = useMemo(() => {
    if (!data) return null;
    return {
      species: speciesLabel(data.species, t),
      sex:
        data.sex === 'male'
          ? t('pets.sex.male')
          : data.sex === 'female'
            ? t('pets.sex.female')
            : t('pets.sex.unknown'),
      breed: data.breed?.trim() ? data.breed : t('pets.detail.unknown'),
      age: typeof data.ageYears === 'number' ? `${data.ageYears} ${t('pets.ageUnit')}` : t('pets.detail.unknown'),
      health: healthSummary(data, t),
      status: petStatusLabel(data.status, t),
      published: formatDateYYYYMMDD(data.createdAt),
    };
  }, [data, t]);

  if (query.isLoading) {
    return (
      <CenteredPage maxWidth="2xl">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </CenteredPage>
    );
  }

  if (query.isError || !data || !info) {
    return (
      <CenteredPage maxWidth="2xl">
        <button type="button" className={cn(btnSecondary, focusRing, 'h-10 w-auto px-4')} onClick={() => navigate('/pets')}>
          {t('pets.detail.back')}
        </button>
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('pets.detail.loadFailed')}
        </p>
      </CenteredPage>
    );
  }

  return (
    <CenteredPage maxWidth="2xl">
      <Link
        to="/pets"
        className={cn(
          'inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover',
          focusRing,
          'rounded-input',
        )}
      >
        {t('pets.detail.back')}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
        <div className="w-full">
          <div className="flex h-[340px] w-full items-center justify-center overflow-hidden rounded-card border border-border-card bg-surface-card sm:h-[420px]">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
            ) : (
              <span className="text-sm text-text-muted">{t('pets.photoPlaceholder')}</span>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-[15px] font-semibold text-text-heading">{t('pets.detail.publisher')}</h2>
            <div className="mt-2 flex items-center gap-3 rounded-card border border-border-card bg-surface-card px-5 py-4">
              <div className="size-11 overflow-hidden rounded-full border border-border-card bg-surface-muted">
                {data.owner.avatarUrl ? (
                  <img src={data.owner.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{data.owner.displayName}</p>
                <p className="text-xs text-text-muted">
                  {data.owner.role === 'ngo' ? t('pets.detail.publisherNgo') : t('pets.detail.publisherUser')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-text-heading sm:text-3xl">{title}</h1>
            <PetStatusBadge status={data.status} t={t} />
          </div>

          <div className="mt-6">
            <h2 className="text-[15px] font-semibold text-text-heading">{t('pets.detail.info')}</h2>
            <div className="mt-2 overflow-hidden rounded-card border border-border-card bg-surface-card">
              <InfoRow label={t('pets.filters.species')} value={info.species} />
              <InfoRow label={t('pets.filters.sex')} value={info.sex} />
              <InfoRow label={t('pets.detail.fields.breed')} value={info.breed} />
              <InfoRow label={t('pets.filters.age')} value={info.age} />
              <InfoRow label={t('pets.detail.fields.health')} value={info.health} />
              <InfoRow label={t('pets.filters.status')} value={info.status} />
              <InfoRow label={t('pets.detail.fields.publishedAt')} value={info.published} />
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-[15px] font-semibold text-text-heading">{t('pets.detail.description')}</h2>
            <div className="mt-2 rounded-card border border-border-card bg-surface-card px-5 py-4 text-sm leading-relaxed text-text-secondary">
              {data.description?.trim() ? data.description : t('pets.detail.noDescription')}
            </div>
          </div>

          <div className="mt-6">
            {isOwnListing ? (
              <div className="flex flex-col items-center gap-3">
                <ButtonLink
                  to={`/pets/${petId}/edit`}
                  className="h-[50px] w-full max-w-[320px] rounded-input text-[15px]"
                >
                  {t('pets.detail.edit')}
                </ButtonLink>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-[50px] w-full max-w-[320px] rounded-input border-danger-border text-[15px] text-danger-text hover:bg-danger-surface"
                  onClick={() => setDeleteOpen(true)}
                >
                  {t('pets.detail.delete')}
                </Button>
              </div>
            ) : data.status === 'adopted' ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  className={cn(btnPrimary, 'h-[50px] w-full max-w-[360px] rounded-[10px] text-[15px] opacity-50')}
                  disabled
                >
                  {t('pets.detail.requestClosed')}
                </button>
              </div>
            ) : data.myRequestStatus === 'pending' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={cn(btnPrimary, 'h-[50px] rounded-[10px] text-[15px] opacity-50')}
                  disabled
                >
                  {t('pets.detail.requestPendingForYou')}
                </button>
                <button
                  type="button"
                  className={cn(btnSecondary, focusRing, 'h-[50px] rounded-[10px] text-[15px]')}
                  onClick={() => startChat(data.owner.id)}
                >
                  {t('pets.detail.startChat')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ButtonLink
                  to={`/pets/${petId}/adopt`}
                  className="h-[50px] rounded-input text-[15px]"
                >
                  {t('pets.detail.sendRequest')}
                </ButtonLink>
                <button
                  type="button"
                  className={cn(btnSecondary, focusRing, 'h-[50px] rounded-[10px] text-[15px]')}
                  onClick={() => startChat(data.owner.id)}
                >
                  {t('pets.detail.startChat')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => !deleteMutation.isPending && setDeleteOpen(false)} title={t('pets.detail.deleteConfirmTitle')}>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            {t('pets.detail.deleteConfirmBody', { name: data.name })}
          </p>
          {deleteMutation.isError ? (
            <p className="mt-3 text-sm text-danger-text" role="alert">
              {t('pets.detail.deleteError')}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteOpen(false)}
            >
              {t('pets.detail.deleteCancel')}
            </Button>
            <Button
              type="button"
              className="border-danger-border bg-danger-text text-white hover:opacity-90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? t('pets.detail.deleting') : t('pets.detail.deleteConfirmAction')}
            </Button>
          </div>
        </div>
      </Modal>
    </CenteredPage>
  );
}

