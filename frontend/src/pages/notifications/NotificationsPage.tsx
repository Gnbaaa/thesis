import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';
import { useIsLoggedIn } from '@/lib/authSession';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/features/notifications/notificationsApi';

const btnSmallSecondary =
  'inline-flex items-center justify-center rounded-md border border-border-input bg-surface-card px-4 py-2 text-[13px] font-medium text-secondary-fg transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-60';

function dotClass(isRead: boolean): string {
  return cn('h-2.5 w-2.5 rounded-full', isRead ? 'bg-text-muted/40' : 'bg-primary');
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = useIsLoggedIn();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', { limit: 50 }],
    queryFn: () => listNotifications({ limit: 50, excludeType: 'chat_message' }),
    enabled: loggedIn,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (!loggedIn) {
    return (
      <section className="w-full max-w-md rounded-card border border-border-card bg-surface-card px-6 py-10">
        <p className="text-sm text-text-secondary">{t('notifications.loginRequired')}</p>
      </section>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <section className="w-full max-w-[1100px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold leading-tight text-text-heading">{t('notifications.title')}</h1>
        <button
          type="button"
          className={cn(btnSmallSecondary, focusRing)}
          disabled={markAllMutation.isPending}
          onClick={() => markAllMutation.mutate()}
        >
          {t('notifications.markAll')}
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border-card bg-surface-card">
        {query.isLoading ? (
          <div className="px-7 py-7 text-sm text-text-muted">{t('common.loading')}</div>
        ) : items.length ? (
          <ul className="divide-y divide-border-card">
            {items.map((n: NotificationItem) => {
              const actionText = n.actionLabel ?? t('notifications.details');
              const actionUrl = n.actionUrl;
              return (
                <li key={n.id} className={cn('flex items-center gap-4 px-7 py-5', n.isRead ? 'bg-surface-card' : 'bg-surface-muted')}>
                  <span className={dotClass(n.isRead)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', n.isRead ? 'font-medium text-text-heading' : 'font-semibold text-text-heading')}>
                      {n.title}
                    </p>
                    <p className="mt-1 text-[13px] text-text-secondary">{n.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                    <span className="text-text-muted">{n.timeLabel}</span>
                    {actionUrl ? (
                      <Link
                        to={actionUrl}
                        className={cn('text-[12px] font-medium text-text underline', focusRing)}
                        onClick={() => markOneMutation.mutate(n.id)}
                      >
                        {actionText}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={cn('text-[12px] font-medium text-text underline', focusRing)}
                        onClick={() => markOneMutation.mutate(n.id)}
                      >
                        {actionText}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-7 py-10 text-sm text-text-muted">{t('notifications.empty')}</div>
        )}
      </div>

      <div className="mt-6">
        <button type="button" className={cn(btnSmallSecondary, focusRing)} onClick={() => navigate(-1)}>
          {t('notifications.back')}
        </button>
      </div>
    </section>
  );
}

