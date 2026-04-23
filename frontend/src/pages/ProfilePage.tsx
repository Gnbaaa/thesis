import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon } from 'lucide-react';
import { getMyProfile, uploadMyAvatar } from '@/features/users/usersApi';
import { cn } from '@/lib/cn';
import { clearAuthSession } from '@/lib/authSession';
import { btnSecondary, focusRing } from '@/lib/uiClasses';

function roleLabel(role: string, t: (k: string) => string): string {
  if (role === 'user') return t('profile.roleUser');
  return role;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['me'],
    queryFn: getMyProfile,
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadMyAvatar,
    onSuccess: (data) => {
      qc.setQueryData(['me'], data);
    },
  });

  const fullName = useMemo(() => {
    const p = query.data;
    if (!p) return '';
    const name = `${p.lastName ?? ''} ${p.firstName ?? ''}`.trim();
    return name || p.email;
  }, [query.data]);

  if (query.isLoading) {
    return <p className="text-sm text-text-muted">{t('common.loading')}</p>;
  }

  if (query.isError || !query.data) {
    return (
      <section className="w-full max-w-[920px] rounded-card border border-border-card bg-surface-card p-6">
        <p className="text-sm text-text-secondary">{t('auth.errors.unknown')}</p>
      </section>
    );
  }

  const p = query.data;
  const pic = p.avatarUrl;

  return (
    <section className="w-full max-w-[920px]">
      <div className="flex items-start gap-6">
        <div className="mt-1 flex size-[96px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-hover">
          {pic ? (
            <img src={pic} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="size-8 text-text-muted" strokeWidth={1.75} aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-text-heading">{fullName}</h1>
          <p className="mt-1 text-sm text-text-muted">{p.email}</p>
          <span className="mt-2 inline-flex items-center rounded-full bg-surface-hover px-3 py-1 text-xs font-medium text-text-secondary">
            {roleLabel(p.role, t)}
          </span>
        </div>

        <div className="shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              uploadMutation.mutate(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className={cn(btnSecondary, focusRing, 'h-9 w-auto px-4')}
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? t('common.loading') : t('profile.uploadPhoto')}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-border-card bg-surface-card">
        <div className="flex items-center justify-between border-b border-border-card px-6 py-4">
          <h2 className="text-sm font-semibold text-text-heading">{t('profile.sectionTitle')}</h2>
          <button type="button" className={cn(btnSecondary, focusRing, 'h-9 w-auto px-4')} disabled>
            {t('profile.edit')}
          </button>
        </div>

        <dl className="divide-y divide-border-card">
          <Row label={t('profile.lastName')} value={p.lastName || '—'} />
          <Row label={t('profile.firstName')} value={p.firstName || '—'} />
          <Row label={t('profile.email')} value={p.email} />
          <Row label={t('profile.phone')} value={p.phone || '—'} />
          <Row label={t('profile.status')} value={t('profile.statusActive')} />
        </dl>
      </div>

      <div className="mt-6">
        <button
          type="button"
          className={cn(btnSecondary, focusRing, 'h-11 w-[120px]')}
          onClick={() => {
            clearAuthSession();
            navigate('/', { replace: true });
          }}
        >
          {t('profile.logout')}
        </button>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 px-6 py-4">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-sm text-text-secondary">{value}</dd>
    </div>
  );
}

