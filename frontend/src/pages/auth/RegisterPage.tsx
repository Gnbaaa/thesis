import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas';
import { registerRequest } from '@/features/auth/authApi';
import { alertError, btnPrimary, focusRing, linkMuted } from '@/lib/uiClasses';
import { cn } from '@/lib/cn';
import { notifyAuthSessionChanged, useIsLoggedIn } from '@/lib/authSession';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = useIsLoggedIn();
  const schema = useMemo(() => registerSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lastName: '',
      firstName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirm: '',
    },
  });

  useEffect(() => {
    if (loggedIn) {
      navigate('/pets', { replace: true });
    }
  }, [loggedIn, navigate]);

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (data) => {
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      notifyAuthSessionChanged();
      navigate('/pets');
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data
          ? String((err.response.data as { message: unknown }).message)
          : err.code === 'ERR_NETWORK'
            ? t('auth.errors.network')
            : t('auth.errors.unknown')
        : t('auth.errors.unknown');
      setError('root', { message: msg });
    },
  });

  return (
    <AuthPageShell className="lg:max-w-[960px]">
      <div className="mx-auto w-full max-w-[440px]">
        <header className="w-full">
          <h1
            id="register-title"
            className="text-2xl font-semibold leading-tight tracking-tight text-text-heading"
          >
            {t('auth.register.title')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {t('auth.register.subtitle')}
          </p>
        </header>

        <form
          className="mt-8 flex w-full flex-col gap-4"
          onSubmit={handleSubmit((values) =>
            mutation.mutate({
              email: values.email,
              password: values.password,
              firstName: values.firstName,
              lastName: values.lastName,
              phone: values.phone.replace(/\s/g, ''),
            }),
          )}
          noValidate
          aria-labelledby="register-title"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthFormField
              id="reg-lastName"
              autoComplete="family-name"
              label={t('auth.register.lastName')}
              error={errors.lastName?.message}
              icon={User}
              {...register('lastName')}
            />
            <AuthFormField
              id="reg-firstName"
              autoComplete="given-name"
              label={t('auth.register.firstName')}
              error={errors.firstName?.message}
              icon={User}
              {...register('firstName')}
            />
          </div>
          <AuthFormField
            id="reg-email"
            type="email"
            autoComplete="email"
            label={t('auth.register.email')}
            error={errors.email?.message}
            icon={Mail}
            {...register('email')}
          />
          <AuthFormField
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            label={t('auth.register.phone')}
            error={errors.phone?.message}
            icon={Phone}
            {...register('phone')}
          />
          <AuthFormField
            id="reg-password"
            type="password"
            autoComplete="new-password"
            label={t('auth.register.password')}
            error={errors.password?.message}
            icon={Lock}
            {...register('password')}
          />
          <AuthFormField
            id="reg-passwordConfirm"
            type="password"
            autoComplete="new-password"
            label={t('auth.register.passwordConfirm')}
            error={errors.passwordConfirm?.message}
            icon={Lock}
            {...register('passwordConfirm')}
          />

          {errors.root?.message ? (
            <p className={alertError} role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <button type="submit" disabled={mutation.isPending} className={cn(btnPrimary, focusRing, 'mt-1 gap-2')}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
                <span>{t('common.loading')}</span>
              </>
            ) : (
              t('auth.register.submit')
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary">
          {t('auth.register.haveAccountPrompt')}{' '}
          <Link to="/login" className={cn(linkMuted, focusRing, 'rounded-sm font-semibold')}>
            {t('auth.register.goLogin')}
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
