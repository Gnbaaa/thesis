import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAuthRole, useIsLoggedIn } from '@/lib/authSession';
import {
  catalogCard,
  catalogCardLink,
  catalogCardImage,
  catalogCardMedia,
  catalogCardMediaEmpty,
  catalogFocus,
  catalogPageBtn,
  catalogPageBtnActive,
  catalogProgressFill,
  catalogProgressTrack,
  catalogSearchGrow,
  catalogSearchRow,
  catalogSelect,
} from '@/lib/catalogStyles';
import { cn } from '@/lib/cn';
import {
  listDonationPosts,
  type DonationDateRange,
  type DonationPostListResponse,
  type DonationPostStatus,
} from '@/features/donations/donationsApi';

const pageSize = 8;

const amountFormatter = new Intl.NumberFormat('en-US');
function formatMnt(value: number): string {
  return `${amountFormatter.format(Math.max(0, Math.round(value)))}₮`;
}

function percent(collected: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((collected / goal) * 100)));
}

export default function DonationsListPage() {
  const { t } = useTranslation();
  const loggedIn = useIsLoggedIn();
  const role = loggedIn ? getAuthRole() : null;
  const canCreate = role === 'ngo' || role === 'admin';

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | DonationPostStatus>('all');
  const [range, setRange] = useState<'all' | DonationDateRange>('all');
  const [page, setPage] = useState(1);

  const query = useQuery<DonationPostListResponse>({
    queryKey: ['donations', { q, status, range, page }],
    queryFn: () =>
      listDonationPosts({
        q: q.trim() || undefined,
        status,
        range,
        page,
        pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total]);

  return (
    <div className="w-full">
      <div className="flex min-h-[60vh] flex-col">
        <div className={catalogSearchRow}>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t('donations.searchPlaceholder')}
            className={cn(catalogSearchGrow, catalogFocus)}
            autoComplete="off"
          />
          {canCreate ? (
            <Link to="/donations/new" className="shrink-0">
              <Button size="sm" className="h-9 w-full sm:w-auto">
                {t('donations.addNew')}
              </Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'all' | DonationPostStatus);
              setPage(1);
            }}
            className={cn(catalogSelect, catalogFocus)}
          >
            <option value="all">{t('donations.filter.all')}</option>
            <option value="active">{t('donations.filter.active')}</option>
            <option value="completed">{t('donations.filter.completed')}</option>
          </select>
          <select
            value={range}
            onChange={(e) => {
              setRange(e.target.value as 'all' | DonationDateRange);
              setPage(1);
            }}
            className={cn(catalogSelect, catalogFocus)}
          >
            <option value="all">{t('donations.filter.dateAll')}</option>
            <option value="last7days">{t('donations.filter.last7days')}</option>
            <option value="last30days">{t('donations.filter.last30days')}</option>
          </select>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {query.isLoading ? (
            <p className="col-span-full text-sm text-text-muted">{t('common.loading')}</p>
          ) : query.data?.items?.length ? (
            query.data.items.map((post) => {
              const pct = percent(post.collectedAmount, post.goalAmount);
              return (
                <article key={post.id} className={catalogCard}>
                  <div className={catalogCardMedia}>
                    {post.photoUrl ? (
                      <img src={post.photoUrl} alt="" className={catalogCardImage} loading="lazy" />
                    ) : (
                      <span className={catalogCardMediaEmpty}>{t('donations.card.imagePlaceholder')}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-text-heading">{post.title}</h3>
                      <Badge variant={post.status === 'active' ? 'success' : 'muted'}>
                        {post.status === 'active'
                          ? t('donations.status.active')
                          : t('donations.status.completed')}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">{post.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                      <span>{formatMnt(post.collectedAmount)}</span>
                      <span className="text-text-muted">/ {formatMnt(post.goalAmount)}</span>
                    </div>
                    <div
                      className={catalogProgressTrack}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className={catalogProgressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-medium text-text-secondary">{pct}%</p>
                    <Link to={`/donations/${post.id}`} className={cn(catalogCardLink, catalogFocus)}>
                      {t('donations.card.details')}
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="col-span-full text-sm text-text-muted">{t('donations.empty')}</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-center gap-2 pt-10">
          <button
            type="button"
            className={cn(catalogPageBtn, catalogFocus)}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label={t('donations.pagination.prev')}
          >
            &lsaquo;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 5)
            .map((p) => (
              <button
                key={p}
                type="button"
                className={cn(p === page ? catalogPageBtnActive : catalogPageBtn, catalogFocus)}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          <button
            type="button"
            className={cn(catalogPageBtn, catalogFocus)}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label={t('donations.pagination.next')}
          >
            &rsaquo;
          </button>
        </div>
      </div>
    </div>
  );
}
