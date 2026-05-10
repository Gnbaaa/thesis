import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ExternalLink, Loader2, Lock, Mail } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import { AuthFormField } from '@/components/auth/AuthFormField';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { getGoogleAuthUrl, loginRequest } from '@/features/auth/authApi';
import { alertError, btnPrimary, btnSecondary, focusRing, linkMuted, linkSubtle } from '@/lib/uiClasses';
import { cn } from '@/lib/cn';
import { notifyAuthSessionChanged, useIsLoggedIn } from '@/lib/authSession';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loggedIn = useIsLoggedIn();
  const schema = useMemo(() => loginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (loggedIn) {
      navigate('/pets', { replace: true });
    }
  }, [loggedIn, navigate]);

  useEffect(() => {
    if (searchParams.get('error') !== 'google') {
      return;
    }
    setError('root', { message: t('auth.errors.google') });
    navigate('/login', { replace: true });
  }, [searchParams, setError, t, navigate]);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired' || reason === 'session_invalid') {
      setError('root', { message: t('auth.errors.sessionEnded') });
    }
  }, [searchParams, setError, t]);

  const mutation = useMutation({
    mutationFn: loginRequest,
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
    <AuthPageShell>
      <div className="mx-auto w-full max-w-[400px]">
        <header className="w-full">
          <h1
            id="login-title"
            className="text-2xl font-semibold leading-tight tracking-tight text-text-heading"
          >
            {t('auth.login.title')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('auth.login.subtitle')}</p>
        </header>

        <form
          className="mt-8 flex w-full flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
          aria-labelledby="login-title"
        >
          <AuthFormField
            id="login-email"
            type="email"
            autoComplete="email"
            label={t('auth.login.email')}
            placeholder={t('auth.login.emailPlaceholder')}
            error={errors.email?.message}
            icon={Mail}
            {...register('email')}
          />
          <AuthFormField
            id="login-password"
            type="password"
            autoComplete="current-password"
            label={t('auth.login.password')}
            placeholder={t('auth.login.passwordPlaceholder')}
            error={errors.password?.message}
            icon={Lock}
            {...register('password')}
          />

          <div className="flex w-full justify-end">
            <Link to="/forgot-password" className={cn(linkSubtle, focusRing, 'rounded-sm')}>
              {t('auth.login.forgot')}
            </Link>
          </div>

          {errors.root?.message ? (
            <p className={alertError} role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <button type="submit" disabled={mutation.isPending} className={cn(btnPrimary, focusRing, 'gap-2')}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
                <span>{t('common.loading')}</span>
              </>
            ) : (
              t('auth.login.submit')
            )}
          </button>
        </form>

        <div className="mt-8 flex w-full items-center gap-3">
          <div className="h-px min-w-0 flex-1 bg-border-card" />
          <span className="shrink-0 text-[13px] font-medium text-text-muted">{t('auth.login.or')}</span>
          <div className="h-px min-w-0 flex-1 bg-border-card" />
        </div>

        <button
          type="button"
          className={cn(btnSecondary, focusRing, 'mt-6 gap-2')}
          onClick={() => {
            window.location.assign(getGoogleAuthUrl());
          }}
        >
          {t('auth.login.google')}
          <ExternalLink className="size-4 shrink-0 text-text-muted" aria-hidden strokeWidth={1.75} />
        </button>

        <p className="mt-8 text-center text-sm text-text-secondary">
          {t('auth.login.newUserPrompt')}{' '}
          <Link to="/register" className={cn(linkMuted, focusRing, 'rounded-sm font-semibold')}>
            {t('auth.login.goRegister')}
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
