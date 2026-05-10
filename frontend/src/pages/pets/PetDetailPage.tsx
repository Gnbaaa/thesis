import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPet, type PetDetail, type PetSpecies, type PetStatus } from '@/features/pets/petsApi';
import { getAuthUserId } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

function statusLabel(status: PetStatus, t: (k: string) => string) {
  return status === 'available'
    ? t('pets.status.available')
    : status === 'pending'
      ? t('pets.status.pending')
      : t('pets.status.adopted');
}

function statusPillClass(status: PetStatus) {
  return status === 'available'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
    : status === 'pending'
      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
      : 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-200';
}

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
  const { id } = useParams();

  const petId = typeof id === 'string' ? id : '';
  const query = useQuery({
    queryKey: ['pets', 'detail', petId],
    queryFn: () => getPet(petId),
    enabled: Boolean(petId),
  });

  const data = query.data;
  const title = data?.name ?? t('pets.detail.title');
  const isOwnListing = Boolean(data?.owner?.id && getAuthUserId() && data.owner.id === getAuthUserId());

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
      status: statusLabel(data.status, t),
      published: formatDateYYYYMMDD(data.createdAt),
    };
  }, [data, t]);

  if (query.isLoading) {
    return (
      <section className="w-full max-w-[1100px]">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </section>
    );
  }

  if (query.isError || !data || !info) {
    return (
      <section className="w-full max-w-[1100px]">
        <button type="button" className={cn(btnSecondary, focusRing, 'h-10 w-auto px-4')} onClick={() => navigate('/pets')}>
          {t('pets.detail.back')}
        </button>
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('pets.detail.loadFailed')}
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1200px]">
      <Link to="/pets" className={cn('inline-flex items-center text-sm text-text-muted hover:text-text-secondary', focusRing, 'rounded-md')}>
        {t('pets.detail.back')}
      </Link>

      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[560px_1fr] lg:gap-12">
        <div className="w-full">
          <div className="flex h-[340px] w-full items-center justify-center overflow-hidden rounded-card border border-border-card bg-surface-card sm:h-[420px]">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
            ) : (
              <span className="text-sm text-text-muted">{t('pets.photoPlaceholder')}</span>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-text-heading">{title}</h1>
            <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', statusPillClass(data.status))}>
              {statusLabel(data.status, t)}
            </span>
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

          <div className="mt-6">
            {isOwnListing ? (
              <div className="flex justify-center">
                <Link
                  to={`/pets/${petId}/edit`}
                  className={cn(btnPrimary, focusRing, 'h-[50px] w-full max-w-[320px] rounded-[10px] text-[15px]')}
                >
                  {t('pets.detail.edit')}
                </Link>
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
              <div className="flex justify-center">
                <button
                  type="button"
                  className={cn(btnPrimary, 'h-[50px] w-full max-w-[360px] rounded-[10px] text-[15px] opacity-50')}
                  disabled
                >
                  {t('pets.detail.requestPendingForYou')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  to={`/pets/${petId}/adopt`}
                  className={cn(btnPrimary, focusRing, 'h-[50px] rounded-[10px] text-[15px]')}
                >
                  {t('pets.detail.sendRequest')}
                </Link>
                <button
                  type="button"
                  className={cn(btnSecondary, focusRing, 'h-[50px] rounded-[10px] text-[15px]')}
                  onClick={() => navigate(`/chat?to=${encodeURIComponent(data.owner.id)}`)}
                >
                  {t('pets.detail.startChat')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

