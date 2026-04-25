import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  adminGetNgoApplication,
  adminUpdateNgoApplicationStatus,
  type AdminNgoApplicationStatus,
} from '@/features/admin/adminNgoApi';
import { cn } from '@/lib/cn';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

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

function statusPillClass(s: AdminNgoApplicationStatus): string {
  if (s === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (s === 'rejected') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

export default function AdminNgoApplicationDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const query = useQuery({
    queryKey: ['adminNgo', 'detail', id],
    queryFn: () => adminGetNgoApplication(id!),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: (status: 'approved' | 'rejected') => adminUpdateNgoApplicationStatus({ id: id!, status }),
    onSuccess: () => {
      query.refetch();
    },
  });

  const app = query.data?.application;

  const requesterRows = useMemo(() => {
    if (!app) return [];
    return [
      { k: t('admin.ngo.detail.requesterName'), v: app.requesterName },
      { k: t('admin.ngo.detail.orgName'), v: app.orgName },
      { k: t('admin.ngo.detail.regNumber'), v: app.regNumber },
      { k: t('admin.ngo.detail.email'), v: app.contactEmail },
      { k: t('admin.ngo.detail.phone'), v: app.contactPhone },
      { k: t('admin.ngo.detail.address'), v: app.orgAddress },
      { k: t('admin.ngo.detail.direction'), v: app.activityDirection },
      { k: t('admin.ngo.detail.submittedAt'), v: formatDate(app.submittedAt) },
    ];
  }, [app, t]);

  return (
    <section className="w-full max-w-[1100px]">
      <Link to="/admin/ngo-applications" className={cn('text-sm text-text-muted hover:text-text-secondary', focusRing)}>
        ← {t('admin.ngo.backToList')}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-heading">{t('admin.ngo.detail.title')}</h1>
        {app ? (
          <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', statusPillClass(app.status))}>
            {statusLabel(app.status, t)}
          </span>
        ) : null}
      </div>

      {query.isLoading ? (
        <p className="mt-6 text-sm text-text-muted">{t('common.loading')}</p>
      ) : query.isError || !app ? (
        <div className="mt-6 rounded-card border border-border-card bg-surface-card p-6">
          <p className="text-sm text-text-secondary">{t('auth.errors.unknown')}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-card border border-border-card bg-surface-card">
              <div className="border-b border-border-card px-5 py-4">
                <h2 className="text-sm font-semibold text-text-heading">{t('admin.ngo.detail.sectionInfo')}</h2>
              </div>
              <dl className="divide-y divide-border-card">
                {requesterRows.map((r) => (
                  <div key={r.k} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                    <dt className="text-xs text-text-muted">{r.k}</dt>
                    <dd className="text-sm text-text-secondary">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="overflow-hidden rounded-card border border-border-card bg-surface-card">
              <div className="border-b border-border-card px-5 py-4">
                <h2 className="text-sm font-semibold text-text-heading">{t('admin.ngo.detail.sectionDesc')}</h2>
              </div>
              <div className="px-5 py-4 text-sm text-text-secondary">{app.description || '—'}</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-card border border-border-card bg-surface-card">
              <div className="border-b border-border-card px-5 py-4">
                <h2 className="text-sm font-semibold text-text-heading">{t('admin.ngo.detail.sectionDocs')}</h2>
              </div>
              <div className="p-5">
                <div className="flex h-[130px] items-center justify-center rounded-lg bg-surface-muted text-xs text-text-muted">
                  PDF
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border-card bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text-secondary">
                      {app.documentOriginalName || t('admin.ngo.detail.document')}
                    </p>
                    <p className="text-xs text-text-muted">
                      {app.documentBytes ? `${Math.max(1, Math.round(app.documentBytes / 1024))} KB` : app.documentPublicId}
                    </p>
                  </div>
                  {app.documentUrl ? (
                    <a
                      href={app.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cn('text-sm font-medium text-primary hover:underline', focusRing)}
                    >
                      {t('admin.ngo.detail.download')}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-card border border-border-card bg-surface-card">
              <div className="border-b border-border-card px-5 py-4">
                <h2 className="text-sm font-semibold text-text-heading">{t('admin.ngo.detail.sectionActions')}</h2>
              </div>
              <div className="flex flex-col gap-3 p-5">
                <button
                  type="button"
                  className={cn(btnPrimary, focusRing, 'h-11')}
                  onClick={() => mutation.mutate('approved')}
                  disabled={mutation.isPending || app.status !== 'pending'}
                >
                  {t('admin.ngo.detail.approve')}
                </button>
                <button
                  type="button"
                  className={cn(btnSecondary, focusRing, 'h-11 border-rose-300 text-rose-600 hover:bg-rose-50')}
                  onClick={() => mutation.mutate('rejected')}
                  disabled={mutation.isPending || app.status !== 'pending'}
                >
                  {t('admin.ngo.detail.reject')}
                </button>
                <button type="button" className={cn(btnSecondary, focusRing, 'h-11')} onClick={() => navigate(-1)}>
                  {t('admin.ngo.detail.back')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

