import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { getAuthRole, useIsLoggedIn } from '@/lib/authSession';
import {
  listDonationPosts,
  type DonationDateRange,
  type DonationPostListResponse,
  type DonationPostStatus,
} from '@/features/donations/donationsApi';

const pageSize = 8;

const listSearch =
  'h-9 w-full rounded-lg border border-zinc-600 bg-zinc-900/90 px-3 text-[13px] text-white placeholder:text-zinc-500';
const listSelect =
  'h-8 min-w-[6.25rem] cursor-pointer appearance-none rounded-full border border-zinc-600/90 bg-zinc-900/95 bg-[length:0.65rem] bg-[right_0.55rem_center] bg-no-repeat px-3 pr-7 text-[13px] text-white [background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%23a1a1aa%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E")]';
const focusList =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';

const amountFormatter = new Intl.NumberFormat('en-US');
function formatMnt(value: number): string {
  return `${amountFormatter.format(Math.max(0, Math.round(value)))}₮`;
}

function percent(collected: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((collected / goal) * 100)));
}

function statusPill(status: DonationPostStatus, t: (k: string) => string) {
  const label =
    status === 'active' ? t('donations.status.active') : t('donations.status.completed');
  const cls =
    status === 'active'
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'bg-zinc-600/80 text-zinc-200';
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', cls)}>
      {label}
    </span>
  );
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
    <div className="w-full max-w-[1440px] text-zinc-100">
      <div className="mb-4 flex items-start justify-between gap-4 px-1 sm:mb-5">
        <h1 className="h-9 text-[25px] font-semibold leading-9 text-white">
          {t('donations.title')}
        </h1>
        {canCreate ? (
          <Link
            to="/donations/new"
            className={cn(
              focusList,
              'inline-flex h-9 w-auto shrink-0 items-center justify-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200 sm:min-w-[10rem]',
            )}
          >
            {t('donations.addNew')}
          </Link>
        ) : null}
      </div>
      <div className="px-1">
        <div className="flex min-h-[80vh] flex-col">
          <div>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t('donations.searchPlaceholder')}
              className={cn(listSearch, focusList)}
              autoComplete="off"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'all' | DonationPostStatus);
                setPage(1);
              }}
              className={cn(listSelect, focusList)}
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
              className={cn(listSelect, focusList)}
            >
              <option value="all">{t('donations.filter.dateAll')}</option>
              <option value="last7days">{t('donations.filter.last7days')}</option>
              <option value="last30days">{t('donations.filter.last30days')}</option>
            </select>
          </div>

          <div className="mt-6 grid grid-cols-2 justify-items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {query.isLoading ? (
              <p className="col-span-full text-sm text-zinc-500">{t('common.loading')}</p>
            ) : query.data?.items?.length ? (
              query.data.items.map((post) => {
                const pct = percent(post.collectedAmount, post.goalAmount);
                return (
                  <article
                    key={post.id}
                    className="w-full max-w-[220px] overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/50"
                  >
                    <div className="flex h-[96px] items-center justify-center bg-zinc-800 text-[11px] text-zinc-500">
                      {post.photoUrl ? (
                        <img
                          src={post.photoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{t('donations.card.imagePlaceholder')}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">{post.title}</h3>
                        {statusPill(post.status, t)}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                        {post.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{formatMnt(post.collectedAmount)}</span>
                        <span className="text-zinc-500">/ {formatMnt(post.goalAmount)}</span>
                      </div>
                      <div
                        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-[width]',
                            post.status === 'completed' || pct >= 100
                              ? 'bg-emerald-400'
                              : 'bg-zinc-100',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-zinc-300">{pct}%</p>
                      <Link
                        to={`/donations/${post.id}`}
                        className={cn(
                          focusList,
                          'mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900/90 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800',
                        )}
                      >
                        {t('donations.card.details')}
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="col-span-full text-sm text-zinc-500">{t('donations.empty')}</p>
            )}
          </div>

          <div className="mt-auto flex items-center justify-center gap-2 pt-10">
            <button
              type="button"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800 text-sm text-zinc-200',
                'disabled:cursor-not-allowed disabled:opacity-40',
                focusList,
              )}
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
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-lg border text-sm',
                    p === page
                      ? 'border-transparent bg-white text-black'
                      : 'border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                    focusList,
                  )}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              type="button"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800 text-sm text-zinc-200',
                'disabled:cursor-not-allowed disabled:opacity-40',
                focusList,
              )}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label={t('donations.pagination.next')}
            >
              &rsaquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
