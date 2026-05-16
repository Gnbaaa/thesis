import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUp } from 'lucide-react';
import {
  createDonationPost,
  uploadDonationImage,
  type CreateDonationPostRequest,
} from '@/features/donations/donationsApi';
import { getAuthRole, useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { alertError, btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MIN_GOAL = 1000;
const MAX_GOAL = 10_000_000_000;

const inputBase =
  'h-10 w-full rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text placeholder:text-text-muted transition-colors';
const textAreaBase =
  'min-h-[110px] w-full rounded-lg border border-border-input bg-surface-card px-3 py-3 text-sm text-text placeholder:text-text-muted transition-colors';

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
      <section className="w-full max-w-[640px]">
        <h1 className="text-2xl font-semibold text-text-heading">
          {t('donations.create.title')}
        </h1>
        <p className="mt-3 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('donations.create.loginRequired')}
        </p>
        <p className="mt-4 text-sm text-text-secondary">
          <Link to="/login" className="text-text-heading underline">
            {t('donations.create.loginFirst')}
          </Link>
        </p>
        <div className="mt-4">
          <Link
            to="/donations"
            className={cn(btnSecondary, focusRing, 'inline-flex h-10 items-center justify-center px-4')}
          >
            {t('donations.create.back')}
          </Link>
        </div>
      </section>
    );
  }

  if (!canCreate) {
    return (
      <section className="w-full max-w-[640px]">
        <h1 className="text-2xl font-semibold text-text-heading">
          {t('donations.create.title')}
        </h1>
        <p className="mt-3 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('donations.create.roleRequired')}
        </p>
        <div className="mt-4">
          <Link
            to="/donations"
            className={cn(btnSecondary, focusRing, 'inline-flex h-10 items-center justify-center px-4')}
          >
            {t('donations.create.back')}
          </Link>
        </div>
      </section>
    );
  }

  const onSubmit = (values: FormValues) => {
    mutation.mutate({ values });
  };

  return (
    <section className="w-full max-w-[880px]">
      <div>
        <Link
          to="/donations"
          className={cn(
            'inline-flex items-center rounded-md text-sm text-text-muted transition-colors hover:text-text-secondary',
            focusRing,
          )}
        >
          {t('donations.create.back')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-heading">
          {t('donations.create.title')}
        </h1>
      </div>
      <p className="mt-2 text-sm text-text-muted">{t('donations.create.subtitle')}</p>

      <form
        className="mt-6 rounded-card border border-border-card bg-surface-card p-6 sm:p-8"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        {mutation.isError ? (
          <p className={cn('mb-5', alertError)} role="alert">
            {t('donations.create.submitError')}
          </p>
        ) : null}

        <div className="flex flex-col gap-5">
          <Field label={t('donations.create.fields.titleLabel')} error={errors.title?.message}>
            <input
              type="text"
              {...register('title')}
              className={cn(inputBase, focusRing)}
              placeholder={t('donations.create.fields.titlePh')}
              autoComplete="off"
            />
          </Field>

          <Field
            label={t('donations.create.fields.description')}
            error={errors.description?.message}
          >
            <textarea
              {...register('description')}
              className={cn(textAreaBase, focusRing)}
              placeholder={t('donations.create.fields.descriptionPh')}
              rows={5}
            />
          </Field>

          <Field
            label={t('donations.create.fields.goalAmount')}
            error={errors.goalAmount?.message}
          >
            <div className="relative">
              <input
                type="text"
                {...register('goalAmount')}
                className={cn(inputBase, focusRing, 'pr-9')}
                placeholder={t('donations.create.fields.goalAmountPh')}
                inputMode="numeric"
                autoComplete="off"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-text-muted">
                {t('donations.create.fields.currencySuffix')}
              </span>
            </div>
          </Field>

          <div>
            <span className="text-sm font-medium text-text-secondary">
              {t('donations.create.fields.photo')}
            </span>
            <div
              className="mt-2 flex flex-col items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-border-input bg-surface-muted px-5 py-8"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-text-muted">
                <ArrowUp className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="mt-1 max-h-40 rounded-lg object-contain"
                />
              ) : null}
              <p className="text-sm font-medium text-text-secondary">
                {t('donations.create.fields.photoDrop')}
              </p>
              <p className="text-xs text-text-muted">
                {t('donations.create.fields.photoTypes')}
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(btnSecondary, focusRing, 'h-9 px-5 text-xs')}
              >
                {t('donations.create.fields.chooseFile')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {file ? <p className="text-xs text-text-muted">{file.name}</p> : null}
              {fileError ? <p className="text-xs text-danger-text">{fileError}</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-border-card pt-6" />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className={cn(btnPrimary, focusRing, 'h-11 min-w-[120px] px-4')}
            disabled={mutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {mutation.isPending ? t('common.loading') : t('donations.create.actions.publish')}
          </button>
          <button
            type="button"
            className={cn(btnSecondary, focusRing, 'h-11 min-w-[120px] px-4')}
            disabled={mutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {mutation.isPending ? t('common.loading') : t('donations.create.actions.save')}
          </button>
          <button
            type="button"
            className={cn(btnSecondary, focusRing, 'h-11 min-w-[120px] px-4')}
            onClick={() => navigate(-1)}
          >
            {t('donations.create.actions.cancel')}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {children}
      {error ? <span className="text-xs text-danger-text">{error}</span> : null}
    </label>
  );
}
