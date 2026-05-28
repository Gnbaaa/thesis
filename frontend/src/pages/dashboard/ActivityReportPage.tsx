import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  getActivityReport,
  type DonationTxStatus,
  type PetStatus,
  type PetSpecies,
  type VolunteerPostStatus,
} from '@/features/reports/reportsApi';
import {
  defaultExportDateRange,
  exportActivityReportPdf,
} from '@/features/reports/exportActivityReportPdf';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScrollTable } from '@/components/ui/ScrollTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getAuthRole } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';
import { listingInputClass } from '@/components/forms/listingFormStyles';

type TabId = 'donations' | 'pets' | 'volunteer';

const amountFormatter = new Intl.NumberFormat('en-US');
function formatMnt(value: number): string {
  return `${amountFormatter.format(Math.max(0, Math.round(value)))}₮`;
}

function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function donationStatusPill(status: DonationTxStatus): string {
  if (status === 'succeeded') return 'bg-emerald-50 text-emerald-700';
  if (status === 'failed') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

function petStatusPill(status: PetStatus): string {
  if (status === 'adopted') return 'bg-zinc-100 text-zinc-700';
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

function volunteerStatusPill(status: VolunteerPostStatus): string {
  return status === 'completed' ? 'bg-zinc-100 text-zinc-700' : 'bg-emerald-50 text-emerald-700';
}

function petSpeciesLabel(s: PetSpecies, t: (k: string) => string): string {
  if (s === 'dog') return t('dashboard.reports.pets.species.dog');
  if (s === 'cat') return t('dashboard.reports.pets.species.cat');
  return t('dashboard.reports.pets.species.other');
}

function shortenRef(value: string | null): string {
  if (!value) return '—';
  return value.length > 24 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex-1 rounded-card border border-border-card bg-surface-card px-6 py-5">
      <p className="text-[13px] text-text-muted">{label}</p>
      <p className="mt-2 text-[26px] font-bold leading-tight text-text-heading">{value}</p>
    </div>
  );
}

export default function ActivityReportPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>('donations');
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const defaultRange = useMemo(() => defaultExportDateRange(), []);
  const [exportFrom, setExportFrom] = useState(defaultRange.from);
  const [exportTo, setExportTo] = useState(defaultRange.to);
  const role = getAuthRole();

  const query = useQuery({
    queryKey: ['dashboard', 'reports'],
    queryFn: () => getActivityReport(),
    staleTime: 30_000,
    enabled: role === 'ngo',
  });

  if (role !== 'ngo') {
    return <Navigate to="/dashboard" replace />;
  }

  const donations = query.data?.donations;
  const pets = query.data?.pets;
  const volunteer = query.data?.volunteer;

  async function handleExportPdf() {
    if (exportFrom > exportTo) {
      setExportError(t('dashboard.reports.exportRangeInvalid'));
      return;
    }

    setExporting(true);
    setExportError(null);
    try {
      const data = await getActivityReport({ from: exportFrom, to: exportTo });
      await exportActivityReportPdf({ tab, data, from: exportFrom, to: exportTo, t });
      setExportOpen(false);
    } catch {
      setExportError(t('dashboard.reports.exportFailed'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold leading-tight text-text-heading">
          {t('dashboard.reports.title')}
        </h1>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          disabled={query.isLoading}
          onClick={() => {
            setExportError(null);
            setExportFrom(defaultRange.from);
            setExportTo(defaultRange.to);
            setExportOpen(true);
          }}
        >
          {t('dashboard.reports.export')}
        </Button>
      </div>

      <Modal
        open={exportOpen}
        onClose={() => !exporting && setExportOpen(false)}
        title={t('dashboard.reports.exportTitle')}
      >
        <div className="grid gap-4 px-5 py-4">
          <p className="text-sm text-text-secondary">
            {t(`dashboard.reports.tabs.${tab}`)} — {t('dashboard.reports.exportRange', { from: exportFrom, to: exportTo })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text-secondary">{t('dashboard.reports.exportFrom')}</span>
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                disabled={exporting}
                className={cn(listingInputClass, focusRing)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-text-secondary">{t('dashboard.reports.exportTo')}</span>
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                disabled={exporting}
                className={cn(listingInputClass, focusRing)}
              />
            </label>
          </div>
          {exportError ? (
            <p className={cn(alertError, 'text-sm')} role="alert">
              {exportError}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" disabled={exporting} onClick={() => setExportOpen(false)}>
              {t('dashboard.reports.exportCancel')}
            </Button>
            <Button type="button" disabled={exporting} onClick={() => void handleExportPdf()}>
              {exporting ? t('dashboard.reports.exporting') : t('dashboard.reports.exportAction')}
            </Button>
          </div>
        </div>
      </Modal>

          {query.isError ? (
            <p className={cn(alertError, 'mt-4')} role="alert">
              {t('dashboard.reports.loadFailed')}
            </p>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <div className="flex min-w-max border-b-2 border-border-card">
            {(['donations', 'pets', 'volunteer'] as TabId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'relative shrink-0 px-4 py-3 text-sm transition-colors sm:px-6',
                  focusRing,
                  tab === id
                    ? 'font-semibold text-text-heading'
                    : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {t(`dashboard.reports.tabs.${id}`)}
                {tab === id ? (
                  <span className="absolute inset-x-0 -bottom-0.5 h-[2px] bg-text-heading" />
                ) : null}
              </button>
            ))}
            </div>
          </div>

          {tab === 'donations' ? (
            <div className="mt-6">
              <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:flex lg:flex-row">
                <StatCard
                  label={t('dashboard.reports.donations.cards.totalCollected')}
                  value={formatMnt(donations?.totalCollected ?? 0)}
                />
                <StatCard
                  label={t('dashboard.reports.donations.cards.successCount')}
                  value={String(donations?.successCount ?? 0)}
                />
                <StatCard
                  label={t('dashboard.reports.donations.cards.last7Days')}
                  value={
                    <>
                      {t('dashboard.reports.donations.cards.last7DaysValue', {
                        count: donations?.last7DaysCount ?? 0,
                      })}
                      <span className="ml-2 text-[12px] font-normal text-text-muted">
                        {t('dashboard.reports.donations.cards.last7DaysWindow')}
                      </span>
                    </>
                  }
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-card border border-border-card bg-surface-card">
                <div className="border-b border-border-card px-6 py-4">
                  <p className="text-[15px] font-semibold text-text-heading">
                    {t('dashboard.reports.donations.tableTitle')}
                  </p>
                </div>
                <ScrollTable minWidth={760}>
                <table className="w-full">
                  <thead className="border-b border-border-card bg-surface-muted">
                    <tr className="text-left text-xs font-semibold text-text-muted">
                      <th className="px-4 py-3 sm:px-6">
                        {t('dashboard.reports.donations.cols.date')}
                      </th>
                      <th className="px-4 py-3">{t('dashboard.reports.donations.cols.post')}</th>
                      <th className="px-4 py-3 text-right">
                        {t('dashboard.reports.donations.cols.amount')}
                      </th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.donations.cols.status')}
                      </th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.donations.cols.ref')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card text-sm">
                    {query.isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : (donations?.transactions ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                          {t('dashboard.reports.donations.empty')}
                        </td>
                      </tr>
                    ) : (
                      donations?.transactions.map((tx) => (
                        <tr key={tx.id} className="text-text-secondary">
                          <td className="px-6 py-3 text-text-muted">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/donations/${tx.postId}`}
                              className={cn('text-text hover:underline', focusRing)}
                            >
                              {tx.postTitle}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-text">
                            {formatMnt(tx.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold',
                                donationStatusPill(tx.status),
                              )}
                            >
                              {t(`dashboard.reports.donations.status.${tx.status}`)}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 font-mono text-[11px] text-text-muted"
                            title={tx.stripePaymentIntentId ?? ''}
                          >
                            {shortenRef(tx.stripePaymentIntentId)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </ScrollTable>
              </div>
            </div>
          ) : null}

          {tab === 'pets' ? (
            <div className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <StatCard
                  label={t('dashboard.reports.pets.cards.total')}
                  value={String(pets?.totalCount ?? 0)}
                />
                <StatCard
                  label={t('dashboard.reports.pets.cards.available')}
                  value={String(pets?.byStatus.available ?? 0)}
                />
                <StatCard
                  label={t('dashboard.reports.pets.cards.pending')}
                  value={String(pets?.byStatus.pending ?? 0)}
                />
                <StatCard
                  label={t('dashboard.reports.pets.cards.adopted')}
                  value={String(pets?.byStatus.adopted ?? 0)}
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-card border border-border-card bg-surface-card">
                <div className="border-b border-border-card px-6 py-4">
                  <p className="text-[15px] font-semibold text-text-heading">
                    {t('dashboard.reports.pets.tableTitle')}
                  </p>
                </div>
                <ScrollTable minWidth={560}>
                <table className="w-full">
                  <thead className="border-b border-border-card bg-surface-muted">
                    <tr className="text-left text-xs font-semibold text-text-muted">
                      <th className="px-4 py-3 sm:px-6">{t('dashboard.reports.pets.cols.name')}</th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.pets.cols.species')}
                      </th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.pets.cols.status')}
                      </th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.pets.cols.date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card text-sm">
                    {query.isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-text-muted">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : (pets?.recent ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-text-muted">
                          {t('dashboard.reports.pets.empty')}
                        </td>
                      </tr>
                    ) : (
                      pets?.recent.map((p) => (
                        <tr key={p.id} className="text-text-secondary">
                          <td className="px-6 py-3">
                            <Link
                              to={`/pets/${p.id}`}
                              className={cn('text-text hover:underline', focusRing)}
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-text-muted">
                            {petSpeciesLabel(p.species, t)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold',
                                petStatusPill(p.status),
                              )}
                            >
                              {t(`dashboard.reports.pets.status.${p.status}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{formatDate(p.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </ScrollTable>
              </div>
            </div>
          ) : null}

          {tab === 'volunteer' ? (
            <div className="mt-6">
              <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:flex lg:flex-row">
                <StatCard
                  label={t('dashboard.reports.volunteer.cards.total')}
                  value={String(volunteer?.totalPosts ?? 0)}
                />
                <StatCard
                  label={t('dashboard.reports.volunteer.cards.active')}
                  value={String(volunteer?.activeCount ?? 0)}
                />
                <StatCard
                  label={t('dashboard.reports.volunteer.cards.registrations')}
                  value={String(volunteer?.totalRegistrations ?? 0)}
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-card border border-border-card bg-surface-card">
                <div className="border-b border-border-card px-6 py-4">
                  <p className="text-[15px] font-semibold text-text-heading">
                    {t('dashboard.reports.volunteer.tableTitle')}
                  </p>
                </div>
                <ScrollTable minWidth={720}>
                <table className="w-full">
                  <thead className="border-b border-border-card bg-surface-muted">
                    <tr className="text-left text-xs font-semibold text-text-muted">
                      <th className="px-4 py-3 sm:px-6">{t('dashboard.reports.volunteer.cols.title')}</th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.volunteer.cols.location')}
                      </th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.volunteer.cols.eventDate')}
                      </th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.volunteer.cols.registered')}
                      </th>
                      <th className="px-4 py-3">
                        {t('dashboard.reports.volunteer.cols.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card text-sm">
                    {query.isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : (volunteer?.recent ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-muted">
                          {t('dashboard.reports.volunteer.empty')}
                        </td>
                      </tr>
                    ) : (
                      volunteer?.recent.map((v) => (
                        <tr key={v.id} className="text-text-secondary">
                          <td className="px-6 py-3">
                            <Link
                              to={`/volunteer/${v.id}`}
                              className={cn('text-text hover:underline', focusRing)}
                            >
                              {v.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{v.location}</td>
                          <td className="px-4 py-3 text-text-muted">
                            {formatDate(v.eventDate)}
                          </td>
                          <td className="px-4 py-3 text-text">
                            {t('dashboard.reports.volunteer.registeredOfRequired', {
                              registered: v.registeredCount,
                              required: v.requiredCount,
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold',
                                volunteerStatusPill(v.status),
                              )}
                            >
                              {t(`dashboard.reports.volunteer.status.${v.status}`)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </ScrollTable>
              </div>
            </div>
          ) : null}
    </DashboardLayout>
  );
}
