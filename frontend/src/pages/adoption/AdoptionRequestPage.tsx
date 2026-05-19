import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { getPet } from '@/features/pets/petsApi';
import { PetStatusBadge } from '@/features/pets/petStatusBadge';
import { createAdoptionRequest } from '@/features/adoption/adoptionApi';
import { adoptionRequestSchema, type AdoptionRequestFormValues } from '@/features/adoption/schemas';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

const inputBase =
  'h-11 w-full rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text placeholder:text-text-muted transition-colors';
const textAreaBase =
  'min-h-[110px] w-full rounded-lg border border-border-input bg-surface-card px-3 py-3 text-sm text-text placeholder:text-text-muted';

export default function AdoptionRequestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loggedIn = useIsLoggedIn();
  const { id } = useParams();
  const petId = typeof id === 'string' ? id : '';

  const schema = useMemo(() => adoptionRequestSchema(t), [t]);

  const petQuery = useQuery({
    queryKey: ['pets', 'detail', petId],
    queryFn: () => getPet(petId),
    enabled: Boolean(petId),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdoptionRequestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: '',
      livingEnvironment: 'apartment',
      hasOwnedPetBefore: 'no',
      householdSize: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    if (!loggedIn) return;
  }, [loggedIn]);

  const mutation = useMutation({
    mutationFn: async (values: AdoptionRequestFormValues) => {
      const householdSize =
        values.householdSize && values.householdSize.trim()
          ? parseInt(values.householdSize.trim(), 10)
          : null;
      return await createAdoptionRequest({
        petId,
        reason: values.reason.trim(),
        livingEnvironment: values.livingEnvironment,
        hasOwnedPetBefore: values.hasOwnedPetBefore === 'yes',
        householdSize,
        contactPhone: values.contactPhone?.trim() ? values.contactPhone.trim() : null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pets', 'detail', petId] });
      navigate(`/pets/${petId}`, { replace: true });
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data && typeof err.response.data === 'object' && 'error' in err.response.data
          ? String((err.response.data as { error: { message: unknown } }).error?.message ?? t('adoption.request.errors.unknown'))
          : err.code === 'ERR_NETWORK'
            ? t('auth.errors.network')
            : t('adoption.request.errors.unknown')
        : t('adoption.request.errors.unknown');
      setError('root', { message: msg });
    },
  });

  if (!petId) {
    return (
      <CenteredPage maxWidth="2xl">
        <p className="text-sm text-text-muted">{t('adoption.request.errors.invalidPet')}</p>
      </CenteredPage>
    );
  }

  if (!loggedIn) {
    return (
      <CenteredPage maxWidth="2xl">
        <header>
          <Link
            to={`/pets/${petId}`}
            className={cn(
              'text-sm font-medium text-accent hover:text-accent-hover',
              focusRing,
              'rounded-input no-underline hover:no-underline',
            )}
          >
            {t('adoption.request.back')}
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-text-heading">{t('adoption.request.title')}</h1>
        </header>
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('adoption.request.loginRequired')}
        </p>
        <div className="mt-4">
          <ButtonLink to="/login" className="max-w-[220px]">
            {t('adoption.request.goLogin')}
          </ButtonLink>
        </div>
      </CenteredPage>
    );
  }

  const pet = petQuery.data;
  const petUnavailable = Boolean(pet && pet.status === 'adopted');
  const alreadySent = Boolean(pet && pet.myRequestStatus === 'pending');

  return (
    <CenteredPage maxWidth="2xl">
      <header className="flex flex-col gap-2">
        <button
          type="button"
          className={cn(
            'text-left text-sm font-medium text-accent hover:text-accent-hover',
            focusRing,
            'rounded-input',
          )}
          onClick={() => navigate(-1)}
        >
          {t('adoption.request.back')}
        </button>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-text-heading">{t('adoption.request.title')}</h1>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="min-w-0">
          <div className="rounded-card border border-border-card bg-surface-card p-6 sm:p-8">
            <h2 className="text-[17px] font-semibold text-text-heading">{t('adoption.request.form.title')}</h2>
            <div className="mt-4 h-px w-full bg-border-card" />

            {petUnavailable ? (
              <p className="mt-5 rounded-card border border-border-card bg-surface-muted px-4 py-3 text-sm text-text-muted">
                {t('adoption.request.errors.petUnavailable')}
              </p>
            ) : alreadySent ? (
              <p className="mt-5 rounded-card border border-border-card bg-surface-muted px-4 py-3 text-sm text-text-muted">
                {t('adoption.request.errors.alreadySent')}
              </p>
            ) : (
              <form className="mt-5 grid gap-5" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-text-secondary">{t('adoption.request.form.reason')}</span>
                <textarea
                  {...register('reason')}
                  className={cn(textAreaBase, focusRing)}
                  placeholder={t('adoption.request.form.reasonPh')}
                />
                {errors.reason ? <span className="text-xs text-danger-text">{errors.reason.message}</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-text-secondary">{t('adoption.request.form.livingEnvironment')}</span>
                <select {...register('livingEnvironment')} className={cn(inputBase, focusRing, 'pr-2')}>
                  <option value="apartment">{t('adoption.request.form.env.apartment')}</option>
                  <option value="house">{t('adoption.request.form.env.house')}</option>
                  <option value="other">{t('adoption.request.form.env.other')}</option>
                </select>
                {errors.livingEnvironment ? <span className="text-xs text-danger-text">{errors.livingEnvironment.message}</span> : null}
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-text-secondary">{t('adoption.request.form.hasOwnedPetBefore')}</span>
                <div className="flex flex-wrap gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
                    <input type="radio" value="yes" className="size-4" {...register('hasOwnedPetBefore')} />
                    {t('common.yes')}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
                    <input type="radio" value="no" className="size-4" {...register('hasOwnedPetBefore')} />
                    {t('common.no')}
                  </label>
                </div>
                {errors.hasOwnedPetBefore ? <span className="text-xs text-danger-text">{errors.hasOwnedPetBefore.message}</span> : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-text-secondary">{t('adoption.request.form.householdSize')}</span>
                  <input {...register('householdSize')} inputMode="numeric" className={cn(inputBase, focusRing)} />
                  {errors.householdSize ? <span className="text-xs text-danger-text">{errors.householdSize.message}</span> : null}
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-text-secondary">{t('adoption.request.form.contactPhone')}</span>
                  <input {...register('contactPhone')} inputMode="tel" className={cn(inputBase, focusRing)} />
                  {errors.contactPhone ? <span className="text-xs text-danger-text">{errors.contactPhone.message}</span> : null}
                </label>
              </div>

              {errors.root?.message ? (
                <p className={alertError} role="alert">
                  {errors.root.message}
                </p>
              ) : null}

              <div className="mt-1 grid grid-cols-2 gap-3">
                <ButtonLink to={`/pets/${petId}`} variant="secondary" className="h-12">
                  {t('common.cancel')}
                </ButtonLink>
                <Button type="submit" disabled={mutation.isPending} className="h-12">
                  {mutation.isPending ? t('common.loading') : t('common.send')}
                </Button>
              </div>
              </form>
            )}
          </div>
        </div>

        <aside className="w-full">
          <div className="overflow-hidden rounded-card border border-border-card bg-surface-card">
            <div className="flex h-[200px] items-center justify-center bg-surface-muted">
              {pet?.photoUrl ? (
                <img src={pet.photoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
              ) : (
                <span className="text-sm text-text-muted">{t('pets.photoPlaceholder')}</span>
              )}
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-text-heading">{pet?.name ?? t('common.loading')}</p>
                {pet ? <PetStatusBadge status={pet.status} t={t} /> : null}
              </div>
              {pet ? (
                <>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t('pets.species.' + pet.species)}{' '}
                    {pet.sex ? `, ${t('pets.sex.' + pet.sex)}` : ''}{' '}
                    {typeof pet.ageYears === 'number' ? `, ${pet.ageYears} ${t('pets.ageUnit')}` : ''}
                  </p>
                  {pet.breed ? <p className="text-sm text-text-secondary">{pet.breed}</p> : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-card border border-border-card bg-surface-card">
            <div className="px-5 py-4">
              <p className="text-[15px] font-semibold text-text-heading">{t('adoption.request.sidebar.petInfo')}</p>
            </div>
            <div className="h-px w-full bg-border-card" />
            <div className="divide-y divide-border-card">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-text-muted">{t('pets.filters.species')}</span>
                <span className="text-[13px] font-medium text-text">{pet ? t('pets.species.' + pet.species) : '-'}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-text-muted">{t('pets.filters.age')}</span>
                <span className="text-[13px] font-medium text-text">
                  {pet && typeof pet.ageYears === 'number' ? `${pet.ageYears} ${t('pets.ageUnit')}` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-text-muted">{t('pets.filters.sex')}</span>
                <span className="text-[13px] font-medium text-text">{pet ? t('pets.sex.' + pet.sex) : '-'}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-text-muted">{t('pets.detail.fields.breed')}</span>
                <span className="text-[13px] font-medium text-text">{pet?.breed ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-text-muted">{t('pets.detail.fields.health')}</span>
                <span className="text-[13px] font-medium text-text">
                  {pet ? (pet.vaccinated ? t('pets.detail.health.vaccinated') : t('pets.detail.health.none')) : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-card border border-border-card bg-surface-card px-5 py-4">
            <div className="size-10 overflow-hidden rounded-full border border-border-card bg-surface-muted">
              {pet?.owner.avatarUrl ? <img src={pet.owner.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{pet?.owner.displayName ?? t('common.loading')}</p>
              <p className="text-xs text-text-muted">
                {pet?.owner.role === 'ngo' ? t('pets.detail.publisherNgo') : t('pets.detail.publisherUser')}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </CenteredPage>
  );
}

