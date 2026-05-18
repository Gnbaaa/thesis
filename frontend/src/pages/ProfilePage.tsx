import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon } from 'lucide-react';
import { getMyProfile, uploadMyAvatar } from '@/features/users/usersApi';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { clearAuthSession } from '@/lib/authSession';

function roleBadge(role: string, t: (k: string) => string) {
  if (role === 'ngo') {
    return <Badge variant="success">{t('profile.roleNgo')}</Badge>;
  }
  if (role === 'admin') {
    return <Badge variant="warning">{t('profile.roleAdmin')}</Badge>;
  }
  return <Badge variant="muted">{t('profile.roleUser')}</Badge>;
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
    return (
      <CenteredPage maxWidth="md">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </CenteredPage>
    );
  }

  if (query.isError || !query.data) {
    return (
      <CenteredPage maxWidth="md">
        <div className="rounded-card border border-border-card bg-surface-card p-6">
          <p className="text-sm text-text-secondary">{t('auth.errors.unknown')}</p>
        </div>
      </CenteredPage>
    );
  }

  const p = query.data;
  const pic = p.avatarUrl;

  return (
    <CenteredPage maxWidth="md">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-card bg-surface-hover">
          {pic ? (
            <img src={pic} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="size-9 text-text-muted" strokeWidth={1.75} aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl font-semibold text-text-heading">{fullName}</h1>
          <p className="mt-1 text-sm text-text-muted">{p.email}</p>
          <div className="mt-2">{roleBadge(p.role, t)}</div>
        </div>

        <div className="shrink-0 sm:ml-auto sm:self-start">
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? t('common.loading') : t('profile.uploadPhoto')}
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border-card bg-surface-card">
        <div className="flex items-center justify-between border-b border-border-card px-5 py-4 sm:px-6">
          <h2 className="font-serif text-base font-semibold text-text-heading">{t('profile.sectionTitle')}</h2>
          <Button type="button" variant="secondary" size="sm" disabled>
            {t('profile.edit')}
          </Button>
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
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            clearAuthSession();
            navigate('/', { replace: true });
          }}
        >
          {t('profile.logout')}
        </Button>
      </div>
    </CenteredPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-[140px_1fr] sm:gap-4 sm:px-6">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-sm font-medium text-text">{value}</dd>
    </div>
  );
}
