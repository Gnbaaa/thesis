import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Building2 } from 'lucide-react';
import { submitNgoApplication } from '@/features/ngo/ngoApi';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { ListingFormField } from '@/components/forms/ListingFormField';
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
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

const MAX_DOC_MB = 10;

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

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

  const fileMeta = useMemo(() => {
    if (!selectedFile) return null;
    const kind = isPdf ? 'PDF' : isImage ? 'зураг' : selectedFile.type || '';
    return [fileSizeLabel, kind].filter(Boolean).join(' • ');
  }, [selectedFile, fileSizeLabel, isPdf, isImage]);

  const tips = useMemo(
    () => [
      t('ngo.apply.tips.reg'),
      t('ngo.apply.tips.doc'),
      t('ngo.apply.tips.contact'),
      t('ngo.apply.tips.review'),
    ],
    [t],
  );

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

  const onSelectFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setFileError(null);
      return;
    }
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      setFileError(t('ngo.apply.fileTooBig', { maxMb: MAX_DOC_MB }));
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onSelectFile(file);
  };

  return (
    <CenteredPage maxWidth="xl">
      <ListingFormShell
        backTo="/profile"
        backLabel={t('ngo.apply.back')}
        panelTitle={t('ngo.apply.panelTitle')}
        tips={tips}
        icon={Building2}
      >
        <form
          className={listingFormInner}
          onSubmit={handleSubmit((values) => {
            if (!selectedFile) return;
            mutation.mutate({ body: values, document: selectedFile });
          })}
          noValidate
        >
          {mutation.isError ? (
            <p className={cn('mb-4', alertError)} role="alert">
              {t('ngo.apply.submitError')}
            </p>
          ) : null}

          <div className={listingFormStack}>
            <ListingFormField label={t('ngo.apply.orgName')} error={errors.orgName?.message}>
              <input
                {...register('orgName')}
                className={cn(listingInputClass, focusRing)}
                placeholder={t('ngo.apply.orgNamePlaceholder')}
              />
            </ListingFormField>

            <div className={listingFormGrid2}>
              <ListingFormField label={t('ngo.apply.regNumber')} error={errors.regNumber?.message}>
                <input
                  {...register('regNumber')}
                  className={cn(listingInputClass, focusRing)}
                  placeholder={t('ngo.apply.regNumberPlaceholder')}
                />
              </ListingFormField>
              <ListingFormField label={t('ngo.apply.activityDirection')} error={errors.activityDirection?.message}>
                <input
                  {...register('activityDirection')}
                  className={cn(listingInputClass, focusRing)}
                  placeholder={t('ngo.apply.activityDirectionPlaceholder')}
                />
              </ListingFormField>
            </div>

            <ListingFormField label={t('ngo.apply.orgAddress')} error={errors.orgAddress?.message}>
              <input
                {...register('orgAddress')}
                className={cn(listingInputClass, focusRing)}
                placeholder={t('ngo.apply.orgAddressPlaceholder')}
              />
            </ListingFormField>

            <div className={listingFormGrid2}>
              <ListingFormField label={t('ngo.apply.contactPhone')} error={errors.contactPhone?.message}>
                <input
                  {...register('contactPhone')}
                  className={cn(listingInputClass, focusRing)}
                  placeholder={t('ngo.apply.contactPhonePlaceholder')}
                />
              </ListingFormField>
              <ListingFormField label={t('ngo.apply.contactEmail')} error={errors.contactEmail?.message}>
                <input
                  {...register('contactEmail')}
                  type="email"
                  className={cn(listingInputClass, focusRing)}
                  placeholder={t('ngo.apply.contactEmailPlaceholder')}
                />
              </ListingFormField>
            </div>

            <ListingFormField label={t('ngo.apply.description')} error={errors.description?.message}>
              <textarea
                {...register('description')}
                className={cn(listingTextareaClass, focusRing)}
                placeholder={t('ngo.apply.descriptionPlaceholder')}
              />
            </ListingFormField>

            <PhotoUploadZone
              label={t('ngo.apply.document')}
              dropHint={t('ngo.apply.documentHint')}
              typesHint={t('ngo.apply.documentTypes', { maxMb: MAX_DOC_MB })}
              chooseLabel={t('ngo.apply.chooseFile')}
              previewUrl={previewUrl}
              fileName={selectedFile?.name ?? null}
              fileError={fileError}
              fileMeta={fileMeta}
              fileRef={fileRef}
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onDrop={onDrop}
              onChoose={() => fileRef.current?.click()}
              onFileChange={onSelectFile}
            />

          </div>

          <div className={listingActionsClass}>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
              {t('ngo.apply.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={mutation.isPending || !selectedFile || Boolean(fileError)}>
              {mutation.isPending ? t('common.loading') : t('ngo.apply.submit')}
            </Button>
          </div>
        </form>
      </ListingFormShell>
    </CenteredPage>
  );
}
