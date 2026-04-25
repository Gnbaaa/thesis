import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowUp } from 'lucide-react';
import { submitNgoApplication } from '@/features/ngo/ngoApi';
import { cn } from '@/lib/cn';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

const MAX_DOC_MB = 10;
const inputBase =
  'h-10 w-full rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text placeholder:text-text-muted transition-colors';

const schema = z.object({
  orgName: z.string().min(2, 'Байгууллагын нэр заавал'),
  regNumber: z.string().min(2, 'Регистрийн дугаар заавал'),
  orgAddress: z.string().min(2, 'Хаяг заавал'),
  activityDirection: z.string().min(2, 'Үйл ажиллагааны чиглэл заавал'),
  contactPhone: z.string().min(6, 'Утасны дугаар буруу байна'),
  contactEmail: z.string().email('И-мэйл буруу байна'),
  description: z.string().max(2000, 'Тайлбар хэт урт байна').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NgoApplicationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isImage = Boolean(selectedFile?.type?.startsWith('image/'));
  const isPdf = selectedFile?.type === 'application/pdf';

  const previewUrl = useMemo(() => {
    if (!selectedFile || !isImage) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile, isImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fileSizeLabel = useMemo(() => {
    if (!selectedFile) return '';
    const kb = Math.round(selectedFile.size / 1024);
    if (kb < 1024) return `${Math.max(1, kb)} KB`;
    const mb = (selectedFile.size / 1024 / 1024).toFixed(1);
    return `${mb} MB`;
  }, [selectedFile]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: '' },
  });

  const mutation = useMutation({
    mutationFn: (params: { body: FormValues; document: File }) =>
      submitNgoApplication({ body: params.body, document: params.document }),
    onSuccess: () => {
      navigate('/profile');
    },
  });

  return (
    <section className="w-full max-w-[920px]">
      <h1 className="text-2xl font-semibold text-text-heading">{t('ngo.apply.title')}</h1>
      <p className="mt-2 text-sm text-text-muted">{t('ngo.apply.subtitle')}</p>

      <form
        className="mt-6 rounded-card border border-border-card bg-surface-card p-6"
        onSubmit={handleSubmit((values) => {
          if (!selectedFile) return;
          mutation.mutate({ body: values, document: selectedFile });
        })}
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label={t('ngo.apply.orgName')} error={errors.orgName?.message}>
            <input
              {...register('orgName')}
              className={cn(inputBase, focusRing)}
              placeholder={t('ngo.apply.orgNamePlaceholder')}
            />
          </Field>

          <Field label={t('ngo.apply.regNumber')} error={errors.regNumber?.message}>
            <input
              {...register('regNumber')}
              className={cn(inputBase, focusRing)}
              placeholder={t('ngo.apply.regNumberPlaceholder')}
            />
          </Field>

          <Field label={t('ngo.apply.orgAddress')} error={errors.orgAddress?.message}>
            <input
              {...register('orgAddress')}
              className={cn(inputBase, focusRing)}
              placeholder={t('ngo.apply.orgAddressPlaceholder')}
            />
          </Field>

          <Field label={t('ngo.apply.activityDirection')} error={errors.activityDirection?.message}>
            <input
              {...register('activityDirection')}
              className={cn(inputBase, focusRing)}
              placeholder={t('ngo.apply.activityDirectionPlaceholder')}
            />
          </Field>

          <Field label={t('ngo.apply.contactPhone')} error={errors.contactPhone?.message}>
            <input
              {...register('contactPhone')}
              className={cn(inputBase, focusRing)}
              placeholder={t('ngo.apply.contactPhonePlaceholder')}
            />
          </Field>

          <Field label={t('ngo.apply.contactEmail')} error={errors.contactEmail?.message}>
            <input
              {...register('contactEmail')}
              className={cn(inputBase, focusRing)}
              placeholder={t('ngo.apply.contactEmailPlaceholder')}
            />
          </Field>

          <Field label={t('ngo.apply.description')} error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={4}
              className={cn(inputBase, focusRing, 'min-h-[110px] resize-none')}
              placeholder={t('ngo.apply.descriptionPlaceholder')}
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-text-secondary">{t('ngo.apply.document')}</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > MAX_DOC_MB * 1024 * 1024) return;
                setSelectedFile(f);
                e.target.value = '';
              }}
            />
            <div className="mt-2 rounded-lg border border-dashed border-border-card bg-surface px-6 py-8">
              <div className="mx-auto flex max-w-[360px] flex-col items-center gap-2 text-center">
                {previewUrl ? (
                  <div className="overflow-hidden rounded-lg border border-border-card bg-surface-muted">
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-[120px] w-[180px] object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-text-muted">
                    <ArrowUp className="size-5" strokeWidth={1.75} aria-hidden />
                  </div>
                )}
                <p className="text-sm text-text-secondary">{t('ngo.apply.documentHint')}</p>
                <p className="text-xs text-text-muted">{t('ngo.apply.documentTypes', { maxMb: MAX_DOC_MB })}</p>
                <button
                  type="button"
                  className={cn(btnSecondary, focusRing, 'mt-2 h-9 w-auto px-4')}
                  onClick={() => fileRef.current?.click()}
                >
                  {t('ngo.apply.chooseFile')}
                </button>
                {selectedFile ? (
                  <div className="mt-2 flex flex-col items-center gap-1 text-xs text-text-muted">
                    <p className="max-w-[320px] truncate">
                      {t('ngo.apply.selectedFile')}: {selectedFile.name}
                    </p>
                    <p>
                      {fileSizeLabel}
                      {isPdf ? ' • PDF' : null}
                      {isImage ? ' • зураг' : null}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            {!selectedFile ? (
              <p className="mt-2 text-xs text-red-600">{t('ngo.apply.documentRequired')}</p>
            ) : null}
          </div>

          <Field label={t('ngo.apply.submittedDate')} error={undefined}>
            <input value={today} readOnly className={cn(inputBase, 'bg-surface-muted text-text-muted')} />
          </Field>

          <div>
            <p className="text-sm font-medium text-text-secondary">{t('ngo.apply.status')}</p>
            <div className="mt-2 rounded-lg border border-border-card bg-surface-muted px-4 py-3 text-sm text-text-muted">
              {t('ngo.apply.statusPending')}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            className={cn(btnPrimary, focusRing, 'h-11 w-[120px]')}
            disabled={mutation.isPending || !selectedFile}
          >
            {mutation.isPending ? t('common.loading') : t('ngo.apply.submit')}
          </button>
          <button type="button" className={cn(btnSecondary, focusRing, 'h-11 w-[120px]')} onClick={() => navigate(-1)}>
            {t('ngo.apply.cancel')}
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
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

