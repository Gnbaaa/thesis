import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { getAuthRole } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/fieldStyles';

type Props = {
  children: ReactNode;
};

export function DashboardLayout({ children }: Props) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const role = getAuthRole();
  const items: Array<{ to: string; key: string; active: boolean }> = [
    { to: '/dashboard', key: 'dashboard', active: pathname === '/dashboard' },
    { to: '/dashboard/inbox', key: 'incoming', active: pathname === '/dashboard/inbox' },
    ...(role === 'ngo'
      ? [{ to: '/dashboard/reports', key: 'reports', active: pathname === '/dashboard/reports' }]
      : []),
  ];

  return (
    <CenteredPage maxWidth="2xl">
      <div className="grid grid-cols-1 overflow-hidden rounded-shell border border-border-card bg-surface-card shadow-sm md:grid-cols-[240px_1fr]">
        <aside className="border-b border-border-card bg-surface px-4 py-5 md:border-b-0 md:border-r">
          <nav className="grid gap-1" aria-label={t('dashboard.user.title')}>
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  'rounded-input px-3 py-2.5 text-sm no-underline hover:no-underline',
                  focusRing,
                  it.active
                    ? 'bg-success-surface font-semibold text-success-text'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-heading',
                )}
              >
                {t(`dashboard.user.sidebar.${it.key}`)}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 bg-surface px-5 py-7 md:px-8 md:py-8">{children}</div>
      </div>
    </CenteredPage>
  );
}
