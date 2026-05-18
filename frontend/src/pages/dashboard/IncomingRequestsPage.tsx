import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getIncomingRequestDetail,
  getIncomingRequests,
  resolveIncomingRequest,
  type AdoptionInboxItem,
  type AdoptionRequestDetail,
} from '@/features/adoption/inboxApi';
import { AdoptionRequestStatusBadge } from '@/features/adoption/adoptionRequestStatusBadge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { alertError, btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

function formatDate(d: string): string {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

function envLabel(v: AdoptionRequestDetail['livingEnvironment'], t: (k: string) => string): string {
  if (v === 'house') return t('dashboard.incoming.env.house');
  if (v === 'other') return t('dashboard.incoming.env.other');
  return t('dashboard.incoming.env.apartment');
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  );
}

export default function IncomingRequestsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const inboxQuery = useQuery({
    queryKey: ['dashboard', 'incoming', { limit: 20 }],
    queryFn: () => getIncomingRequests({ limit: 20 }),
  });

  const detailQuery = useQuery({
    queryKey: ['dashboard', 'incomingDetail', selectedId],
    queryFn: () => getIncomingRequestDetail(selectedId!),
    enabled: Boolean(selectedId),
  });

  const resolveMutation = useMutation({
    mutationFn: (p: { id: string; action: 'approve' | 'reject' }) => resolveIncomingRequest(p),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['dashboard', 'incoming'] });
      await qc.invalidateQueries({ queryKey: ['dashboard', 'incomingDetail'] });
      setSelectedId(null);
    },
  });

  const selected = detailQuery.data;
  const rows = inboxQuery.data?.items ?? [];
  const canResolve = selected?.status === 'pending';

  const petSummary = useMemo(() => {
    if (!selected) return null;
    const parts: string[] = [];
    if (selected.pet.species) parts.push(selected.pet.species);
    if (selected.pet.sex) parts.push(selected.pet.sex);
    if (typeof selected.pet.ageYears === 'number') parts.push(`${selected.pet.ageYears} ${t('pets.ageUnit')}`);
    return parts.join(', ');
  }, [selected, t]);

  return (
    <DashboardLayout>
      <h1 className="font-serif text-2xl font-semibold text-text-heading">{t('dashboard.incoming.title')}</h1>

      {inboxQuery.isError ? (
        <p className={cn(alertError, 'mt-4')} role="alert">
          {t('dashboard.incoming.loadFailed')}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-card border border-border-card bg-surface-card">
        <div className="border-b border-border-card bg-surface-muted px-5 py-3 text-sm font-semibold text-text-muted">
          {t('dashboard.incoming.tableTitle')}
        </div>
        <table className="w-full table-fixed">
          <thead className="border-b border-border-card bg-surface-muted">
            <tr className="text-left text-xs font-semibold text-text-muted">
              <th className="px-4 py-3">{t('dashboard.incoming.cols.petName')}</th>
              <th className="px-4 py-3">{t('dashboard.incoming.cols.requester')}</th>
              <th className="px-4 py-3">{t('dashboard.incoming.cols.date')}</th>
              <th className="px-4 py-3">{t('dashboard.incoming.cols.status')}</th>
              <th className="px-4 py-3">{t('dashboard.incoming.cols.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-card text-sm">
            {inboxQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((it: AdoptionInboxItem) => (
                <tr key={it.id} className="text-text-secondary">
                  <td className="px-4 py-3">{it.petName}</td>
                  <td className="px-4 py-3">{it.requesterName}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(it.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdoptionRequestStatusBadge status={it.status} t={t} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className={cn(
                        'text-sm font-medium text-accent hover:text-accent-hover',
                        focusRing,
                        'rounded-input',
                      )}
                      onClick={() => setSelectedId(it.id)}
                    >
                      {t('dashboard.incoming.details')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                  {t('dashboard.incoming.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={t('dashboard.incoming.detail.title')}
      >
        {detailQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-text-muted">{t('common.loading')}</p>
        ) : detailQuery.isError ? (
          <div className="px-5 py-6">
            <p className={alertError} role="alert">
              {t('dashboard.incoming.detail.loadFailed')}
            </p>
          </div>
        ) : selected ? (
          <div className="grid gap-5 px-5 py-5">
            <div className="overflow-hidden rounded-card border border-border-card bg-surface-muted">
              <div className="flex h-[180px] items-center justify-center">
                {selected.pet.photoUrl ? (
                  <img src={selected.pet.photoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
                ) : (
                  <span className="text-xs text-text-muted">{t('pets.photoPlaceholder')}</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-semibold text-text-heading">{selected.pet.name}</p>
              <p className="text-xs text-text-muted">{petSummary}</p>
              {selected.pet.breed ? <p className="text-xs text-text-muted">{selected.pet.breed}</p> : null}
              <div className="flex items-center gap-2">
                <AdoptionRequestStatusBadge status={selected.status} t={t} />
                <span className="text-xs text-text-muted">{formatDate(selected.createdAt)}</span>
              </div>
            </div>

            <div className="border-t border-border-card pt-4">
              <p className="text-sm font-semibold text-text-heading">{t('dashboard.incoming.detail.requesterTitle')}</p>
              <div className="mt-3 grid gap-3">
                <Field label={t('dashboard.incoming.detail.reason')} value={selected.reason} />
                <Field label={t('dashboard.incoming.detail.env')} value={envLabel(selected.livingEnvironment, t)} />
                <Field
                  label={t('dashboard.incoming.detail.hasOwned')}
                  value={selected.hasOwnedPetBefore ? t('common.yes') : t('common.no')}
                />
                <Field
                  label={t('dashboard.incoming.detail.household')}
                  value={selected.householdSize ?? t('pets.detail.unknown')}
                />
                <Field
                  label={t('dashboard.incoming.detail.phone')}
                  value={selected.contactPhone ?? t('pets.detail.unknown')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-1">
              <button
                type="button"
                disabled={!canResolve || resolveMutation.isPending}
                className={cn(btnPrimary, focusRing, 'h-11 rounded-input')}
                onClick={() => resolveMutation.mutate({ id: selected.id, action: 'approve' })}
              >
                {t('dashboard.incoming.actions.approve')}
              </button>
              <button
                type="button"
                disabled={!canResolve || resolveMutation.isPending}
                className={cn(btnSecondary, focusRing, 'h-11 rounded-input')}
                onClick={() => resolveMutation.mutate({ id: selected.id, action: 'reject' })}
              >
                {t('dashboard.incoming.actions.reject')}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
