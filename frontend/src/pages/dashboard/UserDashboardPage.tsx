import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AdoptionRequestStatusBadge } from '@/features/adoption/adoptionRequestStatusBadge';
import { getMyAdoptionRequests } from '@/features/adoption/inboxApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

function formatDate(d: string): string {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

export default function UserDashboardPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['dashboard', 'myAdoptions'],
    queryFn: () => getMyAdoptionRequests({ limit: 5 }),
  });

  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl font-semibold leading-tight text-text-heading">
        {t('dashboard.user.title')}
      </h1>

      {query.isError ? (
        <p className={cn(alertError, 'mt-4')} role="alert">
          {t('dashboard.user.loadFailed')}
        </p>
      ) : null}

      <div className="mt-6">
        <div className="max-w-sm rounded-card border border-border-card bg-surface-card p-5">
          <p className="text-sm text-text-muted">{t('dashboard.user.cards.pending')}</p>
          <p className="mt-2 text-4xl font-semibold text-text-heading">{query.data?.pendingCount ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border-card bg-surface-card">
        <div className="flex items-center justify-between border-b border-border-card px-5 py-4 sm:px-6">
          <p className="text-[15px] font-semibold text-text-heading">{t('dashboard.user.recent.title')}</p>
          <Link
            to="/dashboard/inbox"
            className={cn(
              'text-sm font-medium text-accent no-underline hover:text-accent-hover hover:no-underline',
              focusRing,
              'rounded-input',
            )}
          >
            {t('dashboard.user.recent.viewAll')}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-border-card bg-surface-muted">
              <tr className="text-left text-xs font-semibold text-text-muted">
                <th className="px-4 py-3">{t('dashboard.user.cols.petName')}</th>
                <th className="px-4 py-3">{t('dashboard.user.cols.sentBy')}</th>
                <th className="px-4 py-3">{t('dashboard.user.cols.date')}</th>
                <th className="px-4 py-3">{t('dashboard.user.cols.status')}</th>
                <th className="px-4 py-3">{t('dashboard.user.cols.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card text-sm">
              {query.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : query.data?.items?.length ? (
                query.data.items.map((it) => (
                  <tr key={it.id} className="text-text-secondary">
                    <td className="px-4 py-3 font-medium text-text">{it.petName}</td>
                    <td className="px-4 py-3">{it.requesterName}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(it.createdAt)}</td>
                    <td className="px-4 py-3">
                      <AdoptionRequestStatusBadge status={it.status} t={t} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/pets/${it.petId}`}
                        className={cn(
                          'text-sm font-medium text-accent no-underline hover:text-accent-hover hover:no-underline',
                          focusRing,
                          'rounded-input',
                        )}
                      >
                        {t('dashboard.user.details')}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                    {t('dashboard.user.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
