import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PawPrint } from 'lucide-react';
import { createPet, uploadPetImage } from '@/features/pets/petsApi';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { ListingFormField } from '@/components/forms/ListingFormField';
import { ListingFormHeader } from '@/components/forms/ListingFormHeader';
import { ListingFormShell } from '@/components/forms/ListingFormShell';
import { PhotoUploadZone } from '@/components/forms/PhotoUploadZone';
import {
  listingActionsClass,
  listingChoiceClass,
  listingChoiceRow,
  listingChoiceRowSplit,
  listingFormGrid2,
  listingFormInner,
  listingFormStack,
  listingInputClass,
  listingSelectClass,
  listingTextareaClass,
} from '@/components/forms/listingFormStyles';
import { Button } from '@/components/ui/Button';
import { useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

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

export default function PetsAddPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const schema = useFormSchema();
  const fileRef = useRef<HTMLInputElement>(null);
  const loggedIn = useIsLoggedIn();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const {
    register,
    handleSubmit,
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

  const tips = useMemo(
    () => [
      t('pets.create.tips.photo'),
      t('pets.create.tips.description'),
      t('pets.create.tips.health'),
      t('pets.create.tips.publish'),
    ],
    [t],
  );

  const mutation = useMutation({
    mutationFn: async (p: { values: FormValues }) => {
      let photoId: string | null = null;
      if (file) {
        const up = await uploadPetImage(file);
        photoId = up.publicId;
      }
      return createPet(mapFormToRequest(p.values, photoId));
    },
    onSuccess: () => {
      navigate('/pets');
    },
  });

  if (!loggedIn) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo="/pets" backLabel={t('pets.create.backList')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('pets.create.loginRequired')}{' '}
          <Link to="/login" className="font-medium text-accent underline">
            {t('pets.create.loginFirst')}
          </Link>
        </p>
      </CenteredPage>
    );
  }

  return (
    <ListingFormShell
      backTo="/pets"
      backLabel={t('pets.create.back')}
      panelTitle={t('pets.create.panelTitle')}
      tips={tips}
      icon={PawPrint}
    >
      <form className={listingFormInner} onSubmit={(e) => e.preventDefault()} noValidate>
        {mutation.isError ? (
          <p className={cn('mb-4', alertError)} role="alert">
            {t('pets.create.submitError')}
          </p>
        ) : null}

        <div className={listingFormStack}>
          <div className={listingFormGrid2}>
            <ListingFormField label={t('pets.create.name')} error={errors.name?.message}>
              <input
                {...register('name')}
                className={cn(listingInputClass, focusRing)}
                autoComplete="off"
                placeholder={t('pets.create.namePh')}
              />
            </ListingFormField>
            <ListingFormField label={t('pets.filters.species')} error={errors.species?.message}>
              <select {...register('species')} className={cn(listingSelectClass, focusRing)}>
                <option value="dog">{t('pets.species.dog')}</option>
                <option value="cat">{t('pets.species.cat')}</option>
                <option value="other">{t('pets.species.other')}</option>
              </select>
            </ListingFormField>
          </div>

          <div className={listingFormGrid2}>
            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-text-label">{t('pets.filters.sex')}</span>
              <div className={listingChoiceRowSplit}>
                <label className={listingChoiceClass}>
                  <input type="radio" value="male" className="size-3.5 accent-primary" {...register('sex')} />
                  {t('pets.sex.male')}
                </label>
                <label className={listingChoiceClass}>
                  <input type="radio" value="female" className="size-3.5 accent-primary" {...register('sex')} />
                  {t('pets.sex.female')}
                </label>
              </div>
              {errors.sex ? <p className="text-xs text-danger-text">{errors.sex.message}</p> : null}
            </div>
            <ListingFormField label={t('pets.create.breed')} error={errors.breed?.message}>
              <input
                {...register('breed')}
                className={cn(listingInputClass, focusRing)}
                placeholder={t('pets.create.breedPh')}
              />
            </ListingFormField>
          </div>

          <ListingFormField label={t('pets.create.age')} error={errors.ageYears?.message}>
            <input
              {...register('ageYears')}
              className={cn(listingInputClass, focusRing)}
              placeholder={t('pets.create.agePh')}
              inputMode="numeric"
            />
          </ListingFormField>

          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-text-label">{t('pets.create.health')}</span>
            <div className={listingChoiceRow}>
              <label className={listingChoiceClass}>
                <input type="checkbox" className="size-3.5 rounded-input accent-primary" {...register('vaccinated')} />
                {t('pets.create.healthVaccinated')}
              </label>
              <label className={listingChoiceClass}>
                <input type="checkbox" className="size-3.5 rounded-input accent-primary" {...register('neutered')} />
                {t('pets.create.healthNeutered')}
              </label>
              <label className={listingChoiceClass}>
                <input type="checkbox" className="size-3.5 rounded-input accent-primary" {...register('spayed')} />
                {t('pets.create.healthSpayed')}
              </label>
            </div>
          </div>

          <ListingFormField label={t('pets.create.description')} error={errors.description?.message}>
            <textarea
              {...register('description')}
              className={cn(listingTextareaClass, focusRing)}
              placeholder={t('pets.create.descriptionPh')}
            />
          </ListingFormField>

          <PhotoUploadZone
            label={t('pets.create.photo')}
            dropHint={t('pets.create.photoDrop')}
            typesHint={t('pets.create.photoTypes')}
            chooseLabel={t('ngo.apply.chooseFile')}
            previewUrl={previewUrl}
            fileName={file?.name ?? null}
            fileError={fileError}
            fileRef={fileRef}
            onDrop={onDrop}
            onChoose={() => fileRef.current?.click()}
            onFileChange={setSelectedFile}
          />
        </div>

        <div className={listingActionsClass}>
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
            {t('pets.create.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={mutation.isPending}
            onClick={handleSubmit((values) => mutation.mutate({ values }))}
          >
            {mutation.isPending ? t('common.loading') : t('pets.create.publish')}
          </Button>
        </div>
      </form>
    </ListingFormShell>
  );
}
