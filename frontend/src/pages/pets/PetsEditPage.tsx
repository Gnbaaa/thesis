import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUp } from 'lucide-react';
import { getPet, updatePet, uploadPetImage, type PetDetail } from '@/features/pets/petsApi';
import { useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const inputBase =
  'h-10 w-full rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text placeholder:text-text-muted transition-colors';
const textAreaBase =
  'min-h-[110px] w-full rounded-lg border border-border-input bg-surface-card px-3 py-3 text-sm text-text placeholder:text-text-muted';

type FormValues = {
  name: string;
  species: 'dog' | 'cat' | 'other';
  sex: 'male' | 'female';
  breed: string;
  ageYears: string;
  description: string;
  vaccinated: boolean;
  neutered: boolean;
  spayed: boolean;
};

function useFormSchema() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('pets.create.errors.name')),
        species: z.enum(['dog', 'cat', 'other']),
        sex: z.enum(['male', 'female']),
        breed: z.string().max(200, t('pets.create.errors.breed')),
        ageYears: z
          .string()
          .refine((s) => !s.trim() || /^\d{1,2}$/.test(s.trim()), t('pets.create.errors.age'))
          .refine((s) => {
            if (!s.trim()) return true;
            const n = parseInt(s, 10);
            return n >= 0 && n <= 50;
          }, t('pets.create.errors.age')),
        description: z.string().max(5000, t('pets.create.errors.descriptionMax')),
        vaccinated: z.boolean(),
        neutered: z.boolean(),
        spayed: z.boolean(),
      }),
    [t],
  );
}

function mapDetailToForm(p: PetDetail): FormValues {
  return {
    name: p.name ?? '',
    species: p.species,
    sex: p.sex === 'unknown' ? 'male' : p.sex,
    breed: p.breed ?? '',
    ageYears: typeof p.ageYears === 'number' ? String(p.ageYears) : '',
    description: p.description ?? '',
    vaccinated: Boolean(p.vaccinated),
    neutered: Boolean(p.neutered),
    spayed: Boolean(p.spayed),
  };
}

function mapFormToRequest(values: FormValues, photoId: string | null) {
  return {
    name: values.name.trim(),
    species: values.species,
    sex: values.sex,
    breed: values.breed.trim() ? values.breed.trim() : null,
    ageYears: values.ageYears.trim() ? parseInt(values.ageYears.trim(), 10) : null,
    description: values.description.trim() ? values.description.trim() : null,
    photoPublicId: photoId,
    vaccinated: values.vaccinated,
    neutered: values.neutered,
    spayed: values.spayed,
  } as const;
}

export default function PetsEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const petId = typeof id === 'string' ? id : '';
  const schema = useFormSchema();
  const fileRef = useRef<HTMLInputElement>(null);
  const loggedIn = useIsLoggedIn();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [existingPhotoPublicId, setExistingPhotoPublicId] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const petQuery = useQuery({
    queryKey: ['pets', 'detail', petId],
    queryFn: () => getPet(petId),
    enabled: Boolean(petId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      species: 'dog',
      sex: 'male',
      breed: '',
      ageYears: '',
      description: '',
      vaccinated: true,
      neutered: false,
      spayed: false,
    },
  });

  useEffect(() => {
    if (!petQuery.data) return;
    reset(mapDetailToForm(petQuery.data));
    setExistingPhotoUrl(petQuery.data.photoUrl ?? null);
    // photoPublicId is not exposed by API; keep as null unless new file uploaded
    setExistingPhotoPublicId(null);
  }, [petQuery.data, reset]);

  const setSelectedFile = (f: File | null) => {
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setFileError(t('pets.create.fileTooBig'));
      return;
    }
    if (f.type !== 'image/jpeg' && f.type !== 'image/png') {
      setFileError(t('pets.create.fileType'));
      return;
    }
    setFile(f);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setSelectedFile(f);
  };

  const mutation = useMutation({
    mutationFn: async (p: { values: FormValues }) => {
      let photoId: string | null = existingPhotoPublicId;
      if (file) {
        const up = await uploadPetImage(file);
        photoId = up.publicId;
      }
      return updatePet(petId, mapFormToRequest(p.values, photoId));
    },
    onSuccess: () => {
      navigate(`/pets/${petId}`);
    },
  });

  if (!loggedIn) {
    return (
      <section className="w-full max-w-[640px]">
        <h1 className="text-2xl font-semibold text-text-heading">{t('pets.edit.title')}</h1>
        <p className="mt-3 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('pets.create.loginRequired')}
        </p>
        <p className="mt-4 text-sm text-text-secondary">
          <Link to="/login" className="text-text-heading underline">
            {t('pets.create.loginFirst')}
          </Link>
        </p>
      </section>
    );
  }

  if (petQuery.isLoading) {
    return (
      <section className="w-full max-w-[880px]">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </section>
    );
  }

  if (petQuery.isError || !petQuery.data) {
    return (
      <section className="w-full max-w-[880px]">
        <button type="button" className={cn(btnSecondary, focusRing, 'h-10 w-auto px-4')} onClick={() => navigate('/pets')}>
          {t('pets.create.back')}
        </button>
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('pets.detail.loadFailed')}
        </p>
      </section>
    );
  }

  const onSave = (values: FormValues) => {
    mutation.mutate({ values });
  };

  return (
    <section className="w-full max-w-[880px]">
      <div>
        <button
          type="button"
          className={cn(
            'inline-flex items-center text-sm text-text-muted hover:text-text-secondary',
            focusRing,
            'rounded-md',
          )}
          onClick={() => navigate(-1)}
        >
          {t('pets.create.back')}
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-text-heading">{t('pets.edit.title')}</h1>
      </div>
      <p className="mt-2 text-sm text-text-muted">{t('pets.edit.subtitle')}</p>

      <form className="mt-6 rounded-card border border-border-card bg-surface-card p-6 sm:p-8" onSubmit={(e) => e.preventDefault()}>
        {mutation.isError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {t('pets.edit.submitError')}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t('pets.create.name')} error={errors.name?.message}>
            <input {...register('name')} className={cn(inputBase, focusRing)} autoComplete="off" placeholder={t('pets.create.namePh')} />
          </Field>
          <Field label={t('pets.filters.species')} error={errors.species?.message}>
            <select {...register('species')} className={cn(inputBase, focusRing, 'pr-2')}>
              <option value="dog">{t('pets.species.dog')}</option>
              <option value="cat">{t('pets.species.cat')}</option>
              <option value="other">{t('pets.species.other')}</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <span className="text-sm font-medium text-text-secondary">{t('pets.filters.sex')}</span>
            <div className={cn('mt-2 flex flex-wrap gap-6 rounded-lg border border-border-input bg-surface-card px-3 py-2.5', focusRing, 'ring-offset-0')}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
                <input type="radio" value="male" className="size-4" {...register('sex')} />
                {t('pets.sex.male')}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
                <input type="radio" value="female" className="size-4" {...register('sex')} />
                {t('pets.sex.female')}
              </label>
            </div>
            {errors.sex ? <p className="mt-1 text-xs text-red-600">{errors.sex.message}</p> : null}
          </div>
          <Field label={t('pets.create.breed')} error={errors.breed?.message}>
            <input {...register('breed')} className={cn(inputBase, focusRing)} placeholder={t('pets.create.breedPh')} />
          </Field>
        </div>

        <div className="mt-5">
          <Field label={t('pets.create.age')} error={errors.ageYears?.message}>
            <input {...register('ageYears')} className={cn(inputBase, focusRing)} placeholder={t('pets.create.agePh')} inputMode="numeric" />
          </Field>
        </div>

        <div className="mt-5">
          <span className="text-sm font-medium text-text-secondary">{t('pets.create.health')}</span>
          <div className="mt-2 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" className="size-4 rounded" {...register('vaccinated')} />
              {t('pets.create.healthVaccinated')}
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" className="size-4 rounded" {...register('neutered')} />
              {t('pets.create.healthNeutered')}
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" className="size-4 rounded" {...register('spayed')} />
              {t('pets.create.healthSpayed')}
            </label>
          </div>
        </div>

        <div className="mt-5">
          <Field label={t('pets.create.description')} error={errors.description?.message}>
            <textarea {...register('description')} className={cn(textAreaBase, focusRing)} placeholder={t('pets.create.descriptionPh')} />
          </Field>
        </div>

        <div className="mt-5">
          <span className="text-sm font-medium text-text-secondary">{t('pets.create.photo')}</span>
          <div className="mt-2 flex flex-col items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-border-input bg-surface-muted px-5 py-8" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-text-muted">
              <ArrowUp className="size-5" aria-hidden />
            </div>
            {previewUrl ? (
              <img src={previewUrl} alt="" className="mt-1 max-h-32 rounded-lg object-contain" />
            ) : existingPhotoUrl ? (
              <img src={existingPhotoUrl} alt="" className="mt-1 max-h-32 rounded-lg object-contain" />
            ) : null}
            <p className="text-sm font-medium text-text-secondary">{t('pets.create.photoDrop')}</p>
            <p className="text-xs text-text-muted">{t('pets.create.photoTypes')}</p>
            <button type="button" onClick={() => fileRef.current?.click()} className={cn(btnSecondary, focusRing, 'h-9 px-5 text-xs')}>
              {t('ngo.apply.chooseFile')}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            {file ? <p className="text-xs text-text-muted">{file.name}</p> : null}
            {fileError ? <p className="text-xs text-red-600">{fileError}</p> : null}
          </div>
        </div>

        <div className="mt-7 border-t border-border-card pt-6" />

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={cn(btnPrimary, focusRing, 'h-11 min-w-[120px] px-4')} disabled={mutation.isPending} onClick={handleSubmit(onSave)}>
            {mutation.isPending ? t('common.loading') : t('pets.edit.save')}
          </button>
          <Link to={`/pets/${petId}`} className={cn(btnSecondary, focusRing, 'inline-flex h-11 min-w-[120px] items-center justify-center px-4')}>
            {t('pets.edit.cancel')}
          </Link>
        </div>
      </form>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

