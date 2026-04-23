import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { forgotPasswordRequest } from '@/features/auth/authApi';
import { btnPrimary, focusRing, linkMuted } from '@/lib/uiClasses';
import { cn } from '@/lib/cn';

type FormValues = { email: string };

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const schema = z.object({
    email: z.string().min(1, t('auth.validation.required')).email(t('auth.validation.email')),
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: forgotPasswordRequest,
    onSuccess: (data) => {
      reset();
      setError('root', { message: t('auth.forgot.success') });
      const showDevToken = (import.meta.env.VITE_SHOW_DEV_RESET_TOKEN ?? '').toLowerCase() === 'true';
      if (showDevToken && data.token && process.env.NODE_ENV !== 'production') {
        setError('root', {
          message: `${t('auth.forgot.success')}\n${t('auth.forgot.devTokenNote')}\nTOKEN: ${data.token}`,
        });
      }
    },
    onError: () => {
      setError('root', { message: t('auth.errors.unknown') });
    },
  });

  return (
    <AuthPageShell>
      <div className="mx-auto w-full max-w-[400px]">
        <h1
          id="forgot-title"
          className="text-2xl font-semibold leading-tight tracking-tight text-text-heading"
        >
          {t('auth.forgot.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{t('auth.forgot.body')}</p>

        <form
          className="mt-8 flex w-full flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
          aria-labelledby="forgot-title"
        >
          <AuthFormField
            id="forgot-email"
            type="email"
            autoComplete="email"
            label={t('auth.forgot.email')}
            placeholder={t('auth.forgot.emailPlaceholder')}
            error={errors.email?.message}
            icon={Mail}
            {...register('email')}
          />
          {errors.root?.message ? (
            <p className="rounded-xl border border-border-card bg-surface-card p-3 text-sm text-text-secondary whitespace-pre-wrap" role="status">
              {errors.root.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={mutation.isPending}
            className={cn(btnPrimary, focusRing)}
          >
            {mutation.isPending ? t('common.loading') : t('auth.forgot.submit')}
          </button>
        </form>

        <Link
          to="/login"
          className={cn(
            linkMuted,
            focusRing,
            'mt-8 inline-flex rounded-sm font-semibold underline-offset-4 hover:underline',
          )}
        >
          {t('auth.forgot.back')}
        </Link>
      </div>
    </AuthPageShell>
  );
}
