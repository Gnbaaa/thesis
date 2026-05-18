import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createVolunteerPost,
  uploadVolunteerImage,
  type CreateVolunteerPostRequest,
} from '@/features/volunteer/volunteerApi';
import { HandHeart } from 'lucide-react';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { ListingFormField } from '@/components/forms/ListingFormField';
import { ListingFormHeader } from '@/components/forms/ListingFormHeader';
import { ListingFormShell } from '@/components/forms/ListingFormShell';
import { PhotoUploadZone } from '@/components/forms/PhotoUploadZone';
import {
  listingActionsClass,
  listingFormGrid2,
  listingFormInner,
  listingFormStack,
  listingInputClass,
  listingTextareaClass,
} from '@/components/forms/listingFormStyles';
import { Button } from '@/components/ui/Button';
import { getAuthRole, useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type FormValues = {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  requiredCount: string;
};

function useFormSchema() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(1, t('volunteer.create.errors.title'))
          .max(200, t('volunteer.create.errors.titleMax')),
        description: z
          .string()
          .min(10, t('volunteer.create.errors.description'))
          .max(5000, t('volunteer.create.errors.descriptionMax')),
        location: z
          .string()
          .min(1, t('volunteer.create.errors.location'))
          .max(200, t('volunteer.create.errors.locationMax')),
        eventDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, t('volunteer.create.errors.eventDate')),
        requiredCount: z
          .string()
          .refine((s) => /^\d{1,5}$/.test(s.trim()), t('volunteer.create.errors.requiredCount'))
          .refine((s) => {
            const n = parseInt(s.trim(), 10);
            return n >= 1 && n <= 10000;
          }, t('volunteer.create.errors.requiredCount')),
      }),
    [t],
  );
}

function mapFormToRequest(values: FormValues, photoId: string | null): CreateVolunteerPostRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    eventDate: values.eventDate,
    requiredCount: parseInt(values.requiredCount.trim(), 10),
    photoPublicId: photoId,
  };
}

export default function VolunteerAddPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const schema = useFormSchema();
  const fileRef = useRef<HTMLInputElement>(null);
  const loggedIn = useIsLoggedIn();
  const role = loggedIn ? getAuthRole() : null;
  const canCreate = role === 'ngo' || role === 'admin';
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
      title: '',
      description: '',
      location: '',
      eventDate: '',
      requiredCount: '',
    },
  });

  const setSelectedFile = (f: File | null) => {
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setFileError(t('volunteer.create.fileTooBig'));
      return;
    }
    if (f.type !== 'image/jpeg' && f.type !== 'image/png') {
      setFileError(t('volunteer.create.fileType'));
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
      t('volunteer.create.tips.date'),
      t('volunteer.create.tips.location'),
      t('volunteer.create.tips.count'),
      t('volunteer.create.tips.description'),
    ],
    [t],
  );

  const mutation = useMutation({
    mutationFn: async (p: { values: FormValues }) => {
      let photoId: string | null = null;
      if (file) {
        const up = await uploadVolunteerImage(file);
        photoId = up.publicId;
      }
      return createVolunteerPost(mapFormToRequest(p.values, photoId));
    },
    onSuccess: () => {
      navigate('/volunteer');
    },
  });

  if (!loggedIn) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo="/volunteer" backLabel={t('volunteer.create.back')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('volunteer.create.loginRequired')}{' '}
          <Link to="/login" className="font-medium text-accent underline">
            {t('volunteer.create.loginFirst')}
          </Link>
        </p>
      </CenteredPage>
    );
  }

  if (!canCreate) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo="/volunteer" backLabel={t('volunteer.create.back')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('volunteer.create.roleRequired')}
        </p>
      </CenteredPage>
    );
  }

  const onSubmit = (values: FormValues) => {
    mutation.mutate({ values });
  };

  return (
    <ListingFormShell
      backTo="/volunteer"
      backLabel={t('volunteer.create.back')}
      panelTitle={t('volunteer.create.panelTitle')}
      tips={tips}
      icon={HandHeart}
    >
      <form className={listingFormInner} onSubmit={(e) => e.preventDefault()} noValidate>
        {mutation.isError ? (
          <p className={cn('mb-4', alertError)} role="alert">
            {t('volunteer.create.submitError')}
          </p>
        ) : null}

        <div className={listingFormStack}>
          <ListingFormField label={t('volunteer.create.fields.titleLabel')} error={errors.title?.message}>
            <input
              type="text"
              {...register('title')}
              className={cn(listingInputClass, focusRing)}
              placeholder={t('volunteer.create.fields.titlePh')}
              autoComplete="off"
            />
          </ListingFormField>

          <ListingFormField label={t('volunteer.create.fields.description')} error={errors.description?.message}>
            <textarea
              {...register('description')}
              className={cn(listingTextareaClass, focusRing)}
              placeholder={t('volunteer.create.fields.descriptionPh')}
              rows={4}
            />
          </ListingFormField>

          <div className={listingFormGrid2}>
            <ListingFormField label={t('volunteer.create.fields.location')} error={errors.location?.message}>
              <input
                type="text"
                {...register('location')}
                className={cn(listingInputClass, focusRing)}
                placeholder={t('volunteer.create.fields.locationPh')}
                autoComplete="off"
              />
            </ListingFormField>
            <ListingFormField label={t('volunteer.create.fields.eventDate')} error={errors.eventDate?.message}>
              <input type="date" {...register('eventDate')} className={cn(listingInputClass, focusRing)} />
            </ListingFormField>
          </div>

          <ListingFormField
            label={t('volunteer.create.fields.requiredCount')}
            error={errors.requiredCount?.message}
          >
            <input
              type="text"
              {...register('requiredCount')}
              className={cn(listingInputClass, focusRing)}
              placeholder={t('volunteer.create.fields.requiredCountPh')}
              inputMode="numeric"
            />
          </ListingFormField>

          <PhotoUploadZone
            label={t('volunteer.create.fields.photo')}
            dropHint={t('volunteer.create.fields.photoDrop')}
            typesHint={t('volunteer.create.fields.photoTypes')}
            chooseLabel={t('volunteer.create.fields.chooseFile')}
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
            {t('volunteer.create.actions.cancel')}
          </Button>
          <Button type="button" size="sm" disabled={mutation.isPending} onClick={handleSubmit(onSubmit)}>
            {mutation.isPending ? t('common.loading') : t('volunteer.create.actions.publish')}
          </Button>
        </div>
      </form>
    </ListingFormShell>
  );
}
