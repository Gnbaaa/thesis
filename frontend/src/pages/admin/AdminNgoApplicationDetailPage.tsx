import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  adminGetNgoApplication,
  adminUpdateNgoApplicationStatus,
  type AdminNgoApplicationStatus,
} from '@/features/admin/adminNgoApi';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
    <CenteredPage maxWidth="2xl">
      <Link
        to="/admin/ngo-applications"
        className={cn('text-sm text-text-muted no-underline hover:text-text-secondary', focusRing)}
      >
        ← {t('admin.ngo.backToList')}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold text-text-heading">{t('admin.ngo.detail.title')}</h1>
        {app ? <Badge variant={statusBadgeVariant(app.status)}>{statusLabel(app.status, t)}</Badge> : null}
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
                      className={cn(
                        'text-sm font-medium text-accent no-underline hover:text-accent-hover hover:no-underline',
                        focusRing,
                      )}
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
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => mutation.mutate('approved')}
                  disabled={mutation.isPending || app.status !== 'pending'}
                >
                  {t('admin.ngo.detail.approve')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full border-danger/40 text-danger hover:bg-danger/10"
                  onClick={() => mutation.mutate('rejected')}
                  disabled={mutation.isPending || app.status !== 'pending'}
                >
                  {t('admin.ngo.detail.reject')}
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={() => navigate(-1)}>
                  {t('admin.ngo.detail.back')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CenteredPage>
  );
}

