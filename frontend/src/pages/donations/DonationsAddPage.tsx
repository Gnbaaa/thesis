import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createDonationPost,
  uploadDonationImage,
  type CreateDonationPostRequest,
} from '@/features/donations/donationsApi';
import { HeartHandshake } from 'lucide-react';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { ListingFormField } from '@/components/forms/ListingFormField';
import { ListingFormHeader } from '@/components/forms/ListingFormHeader';
import { ListingFormShell } from '@/components/forms/ListingFormShell';
import { PhotoUploadZone } from '@/components/forms/PhotoUploadZone';
import {
  listingActionsClass,
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
const MIN_GOAL = 1000;
const MAX_GOAL = 10_000_000_000;

type FormValues = {
  title: string;
  description: string;
  goalAmount: string;
};

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s,]/g, '').trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function useFormSchema() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(1, t('donations.create.errors.title'))
          .max(200, t('donations.create.errors.titleMax')),
        description: z
          .string()
          .min(10, t('donations.create.errors.description'))
          .max(5000, t('donations.create.errors.descriptionMax')),
        goalAmount: z
          .string()
          .refine((s) => parseAmount(s) !== null, t('donations.create.errors.goalAmountFormat'))
          .refine((s) => {
            const n = parseAmount(s);
            return n !== null && n >= MIN_GOAL;
          }, t('donations.create.errors.goalAmountMin'))
          .refine((s) => {
            const n = parseAmount(s);
            return n !== null && n <= MAX_GOAL;
          }, t('donations.create.errors.goalAmountMax')),
      }),
    [t],
  );
}

function mapFormToRequest(
  values: FormValues,
  photoId: string | null,
): CreateDonationPostRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    goalAmount: parseAmount(values.goalAmount) ?? 0,
    photoPublicId: photoId,
  };
}

export default function DonationsAddPage() {
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
      goalAmount: '',
    },
  });

  const setSelectedFile = (f: File | null) => {
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setFileError(t('donations.create.fileTooBig'));
      return;
    }
    if (f.type !== 'image/jpeg' && f.type !== 'image/png') {
      setFileError(t('donations.create.fileType'));
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
      t('donations.create.tips.goal'),
      t('donations.create.tips.description'),
      t('donations.create.tips.photo'),
      t('donations.create.tips.trust'),
    ],
    [t],
  );

  const mutation = useMutation({
    mutationFn: async (p: { values: FormValues }) => {
      let photoId: string | null = null;
      if (file) {
        const up = await uploadDonationImage(file);
        photoId = up.publicId;
      }
      return createDonationPost(mapFormToRequest(p.values, photoId));
    },
    onSuccess: () => {
      navigate('/donations');
    },
  });

  if (!loggedIn) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo="/donations" backLabel={t('donations.create.back')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('donations.create.loginRequired')}{' '}
          <Link to="/login" className="font-medium text-accent underline">
            {t('donations.create.loginFirst')}
          </Link>
        </p>
      </CenteredPage>
    );
  }

  if (!canCreate) {
    return (
      <CenteredPage maxWidth="form">
        <ListingFormHeader backTo="/donations" backLabel={t('donations.create.back')} />
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('donations.create.roleRequired')}
        </p>
      </CenteredPage>
    );
  }

  const onSubmit = (values: FormValues) => {
    mutation.mutate({ values });
  };

  return (
    <ListingFormShell
      backTo="/donations"
      backLabel={t('donations.create.back')}
      panelTitle={t('donations.create.panelTitle')}
      tips={tips}
      icon={HeartHandshake}
    >
      <form className={listingFormInner} onSubmit={(e) => e.preventDefault()} noValidate>
        {mutation.isError ? (
          <p className={cn('mb-4', alertError)} role="alert">
            {t('donations.create.submitError')}
          </p>
        ) : null}

        <div className={listingFormStack}>
          <ListingFormField label={t('donations.create.fields.titleLabel')} error={errors.title?.message}>
            <input
              type="text"
              {...register('title')}
              className={cn(listingInputClass, focusRing)}
              placeholder={t('donations.create.fields.titlePh')}
              autoComplete="off"
            />
          </ListingFormField>

          <ListingFormField
            label={t('donations.create.fields.description')}
            error={errors.description?.message}
          >
            <textarea
              {...register('description')}
              className={cn(listingTextareaClass, focusRing)}
              placeholder={t('donations.create.fields.descriptionPh')}
              rows={4}
            />
          </ListingFormField>

          <ListingFormField label={t('donations.create.fields.goalAmount')} error={errors.goalAmount?.message}>
            <div className="relative">
              <input
                type="text"
                {...register('goalAmount')}
                className={cn(listingInputClass, focusRing, 'pr-9')}
                placeholder={t('donations.create.fields.goalAmountPh')}
                inputMode="numeric"
                autoComplete="off"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">
                {t('donations.create.fields.currencySuffix')}
              </span>
            </div>
          </ListingFormField>

          <PhotoUploadZone
            label={t('donations.create.fields.photo')}
            dropHint={t('donations.create.fields.photoDrop')}
            typesHint={t('donations.create.fields.photoTypes')}
            chooseLabel={t('donations.create.fields.chooseFile')}
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
            {t('donations.create.actions.cancel')}
          </Button>
          <Button type="button" size="sm" disabled={mutation.isPending} onClick={handleSubmit(onSubmit)}>
            {mutation.isPending ? t('common.loading') : t('donations.create.actions.publish')}
          </Button>
        </div>
      </form>
    </ListingFormShell>
  );
}
