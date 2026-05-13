import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getVolunteerPost,
  registerForVolunteerPost,
  unregisterFromVolunteerPost,
  type VolunteerPostDetail,
  type VolunteerPostStatus,
} from '@/features/volunteer/volunteerApi';
import { getAuthUserId, useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

function statusLabel(status: VolunteerPostStatus, t: (k: string) => string) {
  return status === 'active'
    ? t('volunteer.status.active')
    : t('volunteer.status.completed');
}

function statusPillClass(status: VolunteerPostStatus) {
  return status === 'active'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
    : 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-200';
}

function formatDateYYYYMMDD(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10).replace(/-/g, '.');
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-card px-6 py-3.5 last:border-b-0">
      <span className="text-[13px] text-text-muted">{label}</span>
      <span className="text-[13px] font-medium text-text">{value}</span>
    </div>
  );
}

export default function VolunteerDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const loggedIn = useIsLoggedIn();
  const myId = getAuthUserId();

  const postId = typeof id === 'string' ? id : '';
  const detailKey = ['volunteer', 'detail', postId] as const;

  const query = useQuery({
    queryKey: detailKey,
    queryFn: () => getVolunteerPost(postId),
    enabled: Boolean(postId),
  });

  const data = query.data;
  const isOwner = Boolean(data?.owner.id && myId && data.owner.id === myId);

  const info = useMemo(() => {
    if (!data) return null;
    return {
      location: data.location,
      eventDate: formatDateYYYYMMDD(data.eventDate),
      required: `${data.requiredCount} ${t('volunteer.detail.unit')}`,
      registered: `${data.registeredCount} ${t('volunteer.detail.unit')}`,
      status: statusLabel(data.status, t),
      publishedAt: formatDateYYYYMMDD(data.createdAt),
    };
  }, [data, t]);

  const registerMutation = useMutation({
    mutationFn: () => registerForVolunteerPost(postId),
    onSuccess: (next) => {
      queryClient.setQueryData<VolunteerPostDetail>(detailKey, next);
    },
  });
  const unregisterMutation = useMutation({
    mutationFn: () => unregisterFromVolunteerPost(postId),
    onSuccess: (next) => {
      queryClient.setQueryData<VolunteerPostDetail>(detailKey, next);
    },
  });

  if (query.isLoading) {
    return (
      <section className="w-full max-w-[1280px]">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </section>
    );
  }

  if (query.isError || !data || !info) {
    return (
      <section className="w-full max-w-[1280px]">
        <button
          type="button"
          className={cn(btnSecondary, focusRing, 'h-10 w-auto px-4')}
          onClick={() => navigate('/volunteer')}
        >
          {t('volunteer.detail.back')}
        </button>
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('volunteer.detail.loadFailed')}
        </p>
      </section>
    );
  }

  const isClosed = data.status !== 'active';
  const isRegistered = data.isRegisteredByViewer;
  const pendingMutation = registerMutation.isPending || unregisterMutation.isPending;
  const mutationError = registerMutation.isError || unregisterMutation.isError;

  function renderActionButton() {
    if (isOwner) {
      return (
        <Link
          to={`/volunteer/${postId}/edit`}
          className={cn(
            btnPrimary,
            focusRing,
            'flex h-[52px] w-full items-center justify-center rounded-[10px] text-[16px] font-semibold',
          )}
        >
          {t('volunteer.detail.edit')}
        </Link>
      );
    }
    if (isClosed) {
      return (
        <button
          type="button"
          disabled
          className={cn(
            btnPrimary,
            'flex h-[52px] w-full items-center justify-center rounded-[10px] text-[16px] font-semibold opacity-50',
          )}
        >
          {t('volunteer.detail.closed')}
        </button>
      );
    }
    if (!loggedIn) {
      return (
        <button
          type="button"
          onClick={() => navigate('/login')}
          className={cn(
            btnPrimary,
            focusRing,
            'flex h-[52px] w-full items-center justify-center rounded-[10px] text-[16px] font-semibold',
          )}
        >
          {t('volunteer.detail.register')}
        </button>
      );
    }
    if (isRegistered) {
      return (
        <button
          type="button"
          onClick={() => unregisterMutation.mutate()}
          disabled={pendingMutation}
          className={cn(
            btnSecondary,
            focusRing,
            'flex h-[52px] w-full items-center justify-center rounded-[10px] text-[16px] font-semibold disabled:opacity-50',
          )}
        >
          {unregisterMutation.isPending
            ? t('volunteer.detail.unregistering')
            : t('volunteer.detail.unregister')}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => registerMutation.mutate()}
        disabled={pendingMutation}
        className={cn(
          btnPrimary,
          focusRing,
          'flex h-[52px] w-full items-center justify-center rounded-[10px] text-[16px] font-semibold disabled:opacity-60',
        )}
      >
        {registerMutation.isPending
          ? t('volunteer.detail.registering')
          : t('volunteer.detail.register')}
      </button>
    );
  }

  function renderNote() {
    if (isOwner || isClosed) return null;
    const note = isRegistered
      ? t('volunteer.detail.noteRegistered')
      : !loggedIn
        ? t('volunteer.detail.loginRequired')
        : t('volunteer.detail.noteRegister');
    return (
      <div className="rounded-[10px] border border-border-card bg-surface-card px-5 py-4 text-[13px] leading-relaxed text-text-muted">
        {note}
      </div>
    );
  }

  return (
    <section className="w-full max-w-[1280px]">
      <Link
        to="/volunteer"
        className={cn(
          'inline-flex items-center text-sm text-text-muted hover:text-text-secondary',
          focusRing,
          'rounded-md',
        )}
      >
        {t('volunteer.detail.back')}
      </Link>

      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="min-w-0">
          <div className="flex h-[280px] w-full items-center justify-center overflow-hidden rounded-card border border-border-card bg-surface-card sm:h-[320px]">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-sm text-text-muted">{t('volunteer.detail.imagePlaceholder')}</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="flex-1 text-[26px] font-bold leading-tight tracking-tight text-text-heading">
              {data.title}
            </h1>
            <span
              className={cn(
                'inline-flex rounded-full px-3.5 py-1 text-xs font-semibold',
                statusPillClass(data.status),
              )}
            >
              {statusLabel(data.status, t)}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-[15px] font-semibold text-text-heading">
              {t('volunteer.detail.descriptionLabel')}
            </h2>
            <div className="mt-2.5 rounded-[10px] border border-border-card bg-surface-card px-6 py-5 text-[14px] leading-[1.6] text-text-secondary">
              {data.description?.trim() ? data.description : t('volunteer.detail.noDescription')}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-[15px] font-semibold text-text-heading">
              {t('volunteer.detail.organizer')}
            </h2>
            <div className="mt-2.5 flex items-center gap-3.5 rounded-[10px] border border-border-card bg-surface-card px-6 py-4">
              <div className="size-11 overflow-hidden rounded-full border border-border-card bg-surface-muted">
                {data.owner.avatarUrl ? (
                  <img
                    src={data.owner.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">
                  {data.owner.displayName}
                </p>
                <p className="text-xs text-text-muted">
                  {data.owner.role === 'ngo'
                    ? t('volunteer.detail.organizerNgo')
                    : t('volunteer.detail.organizerUser')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-[12px] border border-border-card bg-surface-card">
            <div className="px-6 pb-3.5 pt-5">
              <h2 className="text-[16px] font-semibold text-text-heading">
                {t('volunteer.detail.infoTitle')}
              </h2>
            </div>
            <div className="h-px w-full bg-border-card" />
            <InfoRow label={t('volunteer.detail.fields.location')} value={info.location} />
            <InfoRow label={t('volunteer.detail.fields.eventDate')} value={info.eventDate} />
            <InfoRow label={t('volunteer.detail.fields.requiredCount')} value={info.required} />
            <InfoRow label={t('volunteer.detail.fields.registeredCount')} value={info.registered} />
            <InfoRow label={t('volunteer.detail.fields.status')} value={info.status} />
            <InfoRow label={t('volunteer.detail.fields.publishedAt')} value={info.publishedAt} />
          </div>

          {renderActionButton()}

          {mutationError ? (
            <div className="rounded-[10px] border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {registerMutation.isError
                ? t('volunteer.detail.registerError')
                : t('volunteer.detail.unregisterError')}
            </div>
          ) : null}

          {renderNote()}
        </aside>
      </div>
    </section>
  );
}
