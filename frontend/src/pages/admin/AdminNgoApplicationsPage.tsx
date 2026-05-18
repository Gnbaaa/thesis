import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminListNgoApplications, type AdminNgoApplicationStatus, type AdminNgoListResponse } from '@/features/admin/adminNgoApi';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';

function formatDate(d: string): string {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

function statusLabel(s: AdminNgoApplicationStatus, t: (k: string) => string): string {
  if (s === 'pending') return t('admin.ngo.status.pending');
  if (s === 'approved') return t('admin.ngo.status.approved');
  return t('admin.ngo.status.rejected');
}

function statusBadgeVariant(s: AdminNgoApplicationStatus): 'success' | 'danger' | 'warning' {
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'danger';
  return 'warning';
}

export default function AdminNgoApplicationsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | AdminNgoApplicationStatus>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const query = useQuery<AdminNgoListResponse>({
    queryKey: ['adminNgo', { q, status, page }],
    queryFn: () => adminListNgoApplications({ q: q.trim() || undefined, status, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total]);

  return (
    <CenteredPage maxWidth="2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-heading">{t('admin.ngo.title')}</h1>
        </div>
        <div className="text-sm text-text-muted">
          {t('admin.ngo.total', { count: query.data?.total ?? 0 })}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t('admin.ngo.searchPlaceholder')}
          className={cn(
            'h-10 w-full rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text placeholder:text-text-muted',
            focusRing,
          )}
        />

        <select
          value={status}
          onChange={(e) => {
            const v = e.target.value as 'all' | AdminNgoApplicationStatus;
            setStatus(v);
            setPage(1);
          }}
          className={cn(
            'h-10 w-full rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text sm:w-[180px]',
            focusRing,
          )}
        >
          <option value="all">{t('admin.ngo.filter.all')}</option>
          <option value="pending">{t('admin.ngo.filter.pending')}</option>
          <option value="approved">{t('admin.ngo.filter.approved')}</option>
          <option value="rejected">{t('admin.ngo.filter.rejected')}</option>
        </select>
      </div>

      <div className="mt-5 overflow-hidden rounded-card border border-border-card bg-surface-card">
        <table className="w-full table-fixed">
          <thead className="border-b border-border-card bg-surface-muted">
            <tr className="text-left text-xs font-semibold text-text-muted">
              <th className="w-[56px] px-4 py-3">№</th>
              <th className="px-4 py-3">{t('admin.ngo.cols.requester')}</th>
              <th className="px-4 py-3">{t('admin.ngo.cols.org')}</th>
              <th className="w-[140px] px-4 py-3">{t('admin.ngo.cols.date')}</th>
              <th className="w-[160px] px-4 py-3">{t('admin.ngo.cols.status')}</th>
              <th className="w-[140px] px-4 py-3">{t('admin.ngo.cols.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-card text-sm">
            {query.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : query.data?.items?.length ? (
              query.data.items.map((it, idx) => (
                <tr key={it.id} className="text-text-secondary">
                  <td className="px-4 py-3 text-text-muted">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3">{it.requesterName}</td>
                  <td className="px-4 py-3">{it.orgName}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(it.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant(it.status)}>{statusLabel(it.status, t)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/ngo-applications/${it.id}`}
                      className={cn(
                        'text-sm font-medium text-accent no-underline hover:text-accent-hover hover:no-underline',
                        focusRing,
                        'rounded-input',
                      )}
                    >
                      {t('admin.ngo.details')}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">
                  {t('admin.ngo.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          type="button"
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-lg border border-border-card bg-surface-card text-sm text-text-muted',
            focusRing,
          )}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          aria-label={t('admin.ngo.prev')}
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
          <button
            key={p}
            type="button"
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-lg border text-sm',
              p === page
                ? 'border-transparent bg-text-heading text-white'
                : 'border-border-card bg-surface-card text-text-muted hover:bg-surface-hover',
              focusRing,
            )}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-lg border border-border-card bg-surface-card text-sm text-text-muted',
            focusRing,
          )}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          aria-label={t('admin.ngo.next')}
        >
          ›
        </button>
      </div>
    </CenteredPage>
  );
}

