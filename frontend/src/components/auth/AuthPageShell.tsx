import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PawPrint } from 'lucide-react';
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
        'mx-auto flex w-full max-w-[920px] flex-col overflow-hidden rounded-shell border border-border-card bg-surface-card lg:min-h-[min(560px,calc(100vh-8rem))] lg:flex-row',
        className,
      )}
    >
      <aside className="flex flex-col justify-between gap-6 bg-auth-panel px-6 py-8 text-on-auth-panel sm:px-8 sm:py-10 lg:w-[40%] lg:shrink-0 lg:py-12">
        <div>
          <Link
            to="/pets"
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-input border border-on-auth-panel/15 bg-on-auth-panel/10 text-on-auth-panel transition-opacity hover:bg-on-auth-panel/15',
              focusRingOnAuthPanel,
            )}
            aria-label="Нүүр хуудас"
          >
            <PawPrint className="size-5" strokeWidth={1.75} aria-hidden />
          </Link>
          <h2 className="mt-8 font-serif text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            {t('home.title')}
          </h2>
        </div>
      </aside>

      <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
        {children}
      </div>
    </div>
  );
}
