import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { resetPasswordRequest } from '@/features/auth/authApi';
import { cn } from '@/lib/cn';
import { btnPrimary, focusRing, linkMuted } from '@/lib/uiClasses';

type FormValues = { newPassword: string; confirmPassword: string };

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: z.string().min(8, t('auth.validation.passwordMin')),
          confirmPassword: z.string().min(1, t('auth.validation.required')),
        })
        .refine((v) => v.newPassword === v.confirmPassword, {
          message: t('auth.validation.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!token) {
        throw new Error('missing_token');
      }
      return resetPasswordRequest({ token, newPassword: values.newPassword });
    },
    onSuccess: () => {
      setError('root', { message: t('auth.reset.success') });
    },
    onError: (err) => {
      const msg = err instanceof Error && err.message === 'missing_token' ? t('auth.reset.missingToken') : t('auth.errors.unknown');
      setError('root', { message: msg });
    },
  });

  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-[400px]">
        <h1 id="reset-title" className="text-2xl font-semibold leading-tight tracking-tight text-text-heading">
          {t('auth.reset.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{t('auth.reset.body')}</p>

        <form
          className="mt-8 flex w-full flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
          aria-labelledby="reset-title"
        >
          <AuthFormField
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            label={t('auth.reset.newPassword')}
            placeholder={t('auth.reset.newPasswordPlaceholder')}
            error={errors.newPassword?.message}
            icon={Lock}
            {...register('newPassword')}
          />
          <AuthFormField
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            label={t('auth.reset.confirmPassword')}
            placeholder={t('auth.reset.confirmPasswordPlaceholder')}
            error={errors.confirmPassword?.message}
            icon={Lock}
            {...register('confirmPassword')}
          />

          {errors.root?.message ? (
            <p
              className="whitespace-pre-wrap rounded-xl border border-border-card bg-surface-card p-3 text-sm text-text-secondary"
              role="status"
            >
              {errors.root.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={mutation.isPending}
            className={cn(btnPrimary, focusRing)}
          >
            {mutation.isPending ? t('common.loading') : t('auth.reset.submit')}
          </button>
        </form>

        <Link
          to="/login"
          className={cn(linkMuted, focusRing, 'mt-8 inline-flex rounded-sm font-semibold underline-offset-4 hover:underline')}
        >
          {t('auth.forgot.back')}
        </Link>
      </div>
    </AuthPageShell>
  );
}

