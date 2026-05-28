import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HandHeart } from 'lucide-react';
import {
  getVolunteerPost,
  updateVolunteerPost,
  uploadVolunteerImage,
  type CreateVolunteerPostRequest,
  type VolunteerPostDetail,
  type VolunteerPostStatus,
} from '@/features/volunteer/volunteerApi';
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
  listingSelectClass,
  listingTextareaClass,
} from '@/components/forms/listingFormStyles';
import { Button } from '@/components/ui/Button';
import { getAuthUserId, useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type FormValues = {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  requiredCount: string;
  status: VolunteerPostStatus;
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
        status: z.enum(['active', 'completed']),
      }),
    [t],
  );
}

function mapDetailToForm(post: VolunteerPostDetail): FormValues {
  return {
    title: post.title ?? '',
    description: post.description ?? '',
    location: post.location ?? '',
    eventDate: post.eventDate?.slice(0, 10) ?? '',
    requiredCount: String(post.requiredCount ?? ''),
    status: post.status,
  };
}

function mapFormToRequest(
  values: FormValues,
  photoId: string | null | undefined,
): CreateVolunteerPostRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    eventDate: values.eventDate,
    requiredCount: parseInt(values.requiredCount.trim(), 10),
    status: values.status,
    photoPublicId: photoId ?? null,
  };
}

export default function VolunteerEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const postId = typeof id === 'string' ? id : '';
  const schema = useFormSchema();
  const fileRef = useRef<HTMLInputElement>(null);
  const loggedIn = useIsLoggedIn();
  const myId = getAuthUserId();

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

  const postQuery = useQuery({
    queryKey: ['volunteer', 'detail', postId],
    queryFn: () => getVolunteerPost(postId),
    enabled: Boolean(postId),
  });

  const displayPreviewUrl = previewUrl ?? postQuery.data?.photoUrl ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      eventDate: '',
      requiredCount: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (!postQuery.data) return;
    reset(mapDetailToForm(postQuery.data));
  }, [postQuery.data, reset]);

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
      let photoId: string | null | undefined = postQuery.data?.photoPublicId ?? null;
      if (file) {
        const up = await uploadVolunteerImage(file);
        photoId = up.publicId;
      }
      return updateVolunteerPost(postId, mapFormToRequest(p.values, photoId));
    },
    onSuccess: () => {
      navigate(`/volunteer/${postId}`);
    },
  });

  if (!loggedIn) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo={`/volunteer/${postId}`} backLabel={t('volunteer.edit.back')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('volunteer.create.loginRequired')}{' '}
          <Link to="/login" className="font-medium text-accent underline">
            {t('volunteer.create.loginFirst')}
          </Link>
        </p>
      </CenteredPage>
    );
  }

  if (postQuery.isLoading) {
    return (
      <CenteredPage maxWidth="form">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </CenteredPage>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo="/volunteer" backLabel={t('volunteer.edit.back')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('volunteer.detail.loadFailed')}
        </p>
      </CenteredPage>
    );
  }

  const isOwner = Boolean(postQuery.data.owner.id && myId && postQuery.data.owner.id === myId);
  if (!isOwner) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo={`/volunteer/${postId}`} backLabel={t('volunteer.edit.back')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('volunteer.edit.forbidden')}
        </p>
      </CenteredPage>
    );
  }

  const onSave = (values: FormValues) => {
    mutation.mutate({ values });
  };

  return (
    <ListingFormShell
      backTo={`/volunteer/${postId}`}
      backLabel={t('volunteer.edit.back')}
      panelTitle={t('volunteer.create.panelTitle')}
      tips={tips}
      icon={HandHeart}
    >
      <form className={listingFormInner} onSubmit={(e) => e.preventDefault()} noValidate>
        {mutation.isError ? (
          <p className={cn('mb-4', alertError)} role="alert">
            {t('volunteer.edit.submitError')}
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

          <div className={listingFormGrid2}>
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
            <ListingFormField label={t('volunteer.create.fields.status')} error={errors.status?.message}>
              <select {...register('status')} className={cn(listingSelectClass, focusRing)}>
                <option value="active">{t('volunteer.status.active')}</option>
                <option value="completed">{t('volunteer.status.completed')}</option>
              </select>
            </ListingFormField>
          </div>

          <PhotoUploadZone
            label={t('volunteer.create.fields.photo')}
            dropHint={t('volunteer.create.fields.photoDrop')}
            typesHint={t('volunteer.create.fields.photoTypes')}
            chooseLabel={t('volunteer.create.fields.chooseFile')}
            previewUrl={displayPreviewUrl}
            fileName={file?.name ?? null}
            fileError={fileError}
            fileRef={fileRef}
            onDrop={onDrop}
            onChoose={() => fileRef.current?.click()}
            onFileChange={setSelectedFile}
          />
        </div>

        <div className={listingActionsClass}>
          <Link
            to={`/volunteer/${postId}`}
            className="inline-flex h-9 items-center justify-center rounded-input px-3 text-sm font-medium text-secondary-fg transition-colors hover:bg-surface-hover hover:text-text-heading"
          >
            {t('volunteer.edit.cancel')}
          </Link>
          <Button type="button" size="sm" disabled={mutation.isPending} onClick={handleSubmit(onSave)}>
            {mutation.isPending ? t('common.loading') : t('volunteer.edit.save')}
          </Button>
        </div>
      </form>
    </ListingFormShell>
  );
}
