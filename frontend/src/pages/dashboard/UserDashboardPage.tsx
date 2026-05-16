import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getMyAdoptionRequests, type AdoptionRequestStatus } from '@/features/adoption/inboxApi';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

function formatDate(d: string): string {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

function statusLabel(s: AdoptionRequestStatus, t: (k: string) => string): string {
  if (s === 'approved') return t('dashboard.user.status.approved');
  if (s === 'rejected') return t('dashboard.user.status.rejected');
  return t('dashboard.user.status.pending');
}

function statusPillClass(s: AdoptionRequestStatus): string {
  if (s === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (s === 'rejected') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

export default function UserDashboardPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['dashboard', 'myAdoptions'],
    queryFn: () => getMyAdoptionRequests({ limit: 5 }),
  });

  return (
    <section className="w-full max-w-[1200px]">
      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-card border border-border-card bg-surface-card md:grid-cols-[260px_1fr]">
        <aside className="border-b border-border-card bg-surface px-4 py-5 md:border-b-0 md:border-r">
          <div className="grid gap-1">
            <Link
              to="/dashboard"
              className={cn('rounded-lg bg-surface-muted px-3 py-2.5 text-sm font-semibold text-text-heading', focusRing)}
            >
              {t('dashboard.user.sidebar.dashboard')}
            </Link>
            <Link
              to="/dashboard/inbox"
              className={cn('rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover', focusRing)}
            >
              {t('dashboard.user.sidebar.incoming')}
            </Link>
            <Link
              to="/dashboard/reports"
              className={cn('rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover', focusRing)}
            >
              {t('dashboard.user.sidebar.reports')}
            </Link>
          </div>
        </aside>

        <main className="bg-surface-muted px-5 py-7 md:px-10 md:py-9">
          <h1 className="text-[26px] font-semibold leading-tight text-text-heading">{t('dashboard.user.title')}</h1>

          {query.isError ? (
            <p className={cn(alertError, 'mt-4')} role="alert">
              {t('dashboard.user.loadFailed')}
            </p>
          ) : null}

          <div className="mt-7">
            <div className="rounded-card border border-border-card bg-surface-card p-6">
              <p className="text-sm text-text-muted">{t('dashboard.user.cards.pending')}</p>
              <p className="mt-2 text-4xl font-semibold text-text-heading">{query.data?.pendingCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-7 overflow-hidden rounded-card border border-border-card bg-surface-card">
            <div className="flex items-center justify-between border-b border-border-card px-6 py-4">
              <p className="text-[15px] font-semibold text-text-heading">{t('dashboard.user.recent.title')}</p>
              <Link to="/dashboard" className={cn('text-sm font-medium text-primary underline', focusRing)}>
                {t('dashboard.user.recent.viewAll')}
              </Link>
            </div>

            <table className="w-full table-fixed">
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
                      <td className="px-4 py-3">{it.petName}</td>
                      <td className="px-4 py-3">{it.requesterName}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(it.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', statusPillClass(it.status))}>
                          {statusLabel(it.status, t)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/pets/${it.petId}`} className={cn('text-sm font-medium text-primary hover:underline', focusRing)}>
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
        </main>
      </div>
    </section>
  );
}

