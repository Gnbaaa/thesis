import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { focusRingOnAuthPanel } from '@/lib/uiClasses';

type Props = {
  children: ReactNode;
  className?: string;
};

export function AuthPageShell({ children, className }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'flex w-full max-w-[920px] flex-col overflow-hidden rounded-shell border border-border-card bg-surface-card shadow-sm dark:shadow-none lg:min-h-[min(580px,calc(100vh-8rem))] lg:flex-row',
        className,
      )}
    >
      <aside className="flex flex-col justify-between gap-8 bg-auth-panel px-6 py-8 text-on-auth-panel sm:px-8 sm:py-10 lg:w-[42%] lg:shrink-0 lg:py-12">
        <div>
          <Link
            to="/"
            className={cn(
              'inline-block text-sm font-semibold tracking-tight text-on-auth-panel transition-opacity hover:opacity-95',
              focusRingOnAuthPanel,
              'rounded-sm',
            )}
          >
            {t('auth.logo')}
          </Link>
          <h2 className="mt-6 text-xl font-semibold leading-snug tracking-tight sm:mt-8 sm:text-2xl">
            {t('home.title')}
          </h2>
          <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-on-auth-panel-muted">{t('home.subtitle')}</p>
        </div>
        <p className="hidden text-xs leading-relaxed text-on-auth-panel-faint lg:block">{t('auth.shell.footerNote')}</p>
      </aside>

      <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">{children}</div>
    </div>
  );
}
