import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listPets, type PetListResponse, type PetSex, type PetSpecies, type PetStatus } from '@/features/pets/petsApi';
import { useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';

const pageSize = 8;

const listSearch =
  'h-9 w-full rounded-lg border border-zinc-600 bg-zinc-900/90 px-3 text-[13px] text-white placeholder:text-zinc-500';
const listSelect =
  'h-8 min-w-[6.25rem] cursor-pointer appearance-none rounded-full border border-zinc-600/90 bg-zinc-900/95 bg-[length:0.65rem] bg-[right_0.55rem_center] bg-no-repeat px-3 pr-7 text-[13px] text-white [background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%23a1a1aa%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E")]';
const listBtnGhost =
  'h-8 cursor-not-allowed rounded-full border border-zinc-500/50 bg-zinc-800 px-3.5 text-[13px] text-zinc-500';
const focusList =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';

function statusPill(status: PetStatus, t: (k: string) => string) {
  const label =
    status === 'available'
      ? t('pets.status.available')
      : status === 'pending'
        ? t('pets.status.pending')
        : t('pets.status.adopted');
  const cls =
    status === 'available'
      ? 'bg-emerald-500/20 text-emerald-300'
      : status === 'pending'
        ? 'bg-amber-500/20 text-amber-200'
        : 'bg-zinc-600/80 text-zinc-200';
  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', cls)}>{label}</span>;
}

function metaLine(p: { species: PetSpecies; breed: string | null; ageYears: number | null }, t: (k: string) => string) {
  const s =
    p.species === 'dog' ? t('pets.species.dog') : p.species === 'cat' ? t('pets.species.cat') : t('pets.species.other');
  const parts = [s, p.breed].filter(Boolean);
  const age = typeof p.ageYears === 'number' ? `${p.ageYears} ${t('pets.ageUnit')}` : null;
  return [parts.join(' · '), age].filter(Boolean).join(' · ');
}

export default function PetsListPage() {
  const { t } = useTranslation();
  const loggedIn = useIsLoggedIn();
  const [q, setQ] = useState('');
  const [species, setSpecies] = useState<'all' | PetSpecies>('all');
  const [sex, setSex] = useState<'all' | PetSex>('all');
  const [status, setStatus] = useState<'all' | PetStatus>('all');
  const [page, setPage] = useState(1);

  const query = useQuery<PetListResponse>({
    queryKey: ['pets', { q, species, sex, status, page }],
    queryFn: () =>
      listPets({
        q: q.trim() || undefined,
        species,
        sex,
        status,
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
        <h1 className="h-9 text-[25px] font-semibold leading-9 text-white">{t('pets.title')}</h1>
        {loggedIn ? (
          <Link
            to="/pets/new"
            className={cn(
              focusList,
              'inline-flex h-9 w-auto shrink-0 items-center justify-center rounded-lg bg-white px-4 text-[13px] font-semibold text-black transition-colors hover:bg-zinc-200 sm:min-w-[10rem]',
            )}
          >
            {t('pets.add')}
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
              placeholder={t('pets.search')}
              className={cn(listSearch, focusList)}
              autoComplete="off"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <select
              value={species}
              onChange={(e) => {
                setSpecies(e.target.value as 'all' | PetSpecies);
                setPage(1);
              }}
              className={cn(listSelect, focusList)}
            >
              <option value="all">{t('pets.filters.species')}</option>
              <option value="dog">{t('pets.species.dog')}</option>
              <option value="cat">{t('pets.species.cat')}</option>
              <option value="other">{t('pets.species.other')}</option>
            </select>
            <select
              value={sex}
              onChange={(e) => {
                setSex(e.target.value as 'all' | PetSex);
                setPage(1);
              }}
              className={cn(listSelect, focusList)}
            >
              <option value="all">{t('pets.filters.sex')}</option>
              <option value="male">{t('pets.sex.male')}</option>
              <option value="female">{t('pets.sex.female')}</option>
              <option value="unknown">{t('pets.sex.unknown')}</option>
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'all' | PetStatus);
                setPage(1);
              }}
              className={cn(listSelect, focusList)}
            >
              <option value="all">{t('pets.filters.status')}</option>
              <option value="available">{t('pets.status.available')}</option>
              <option value="pending">{t('pets.status.pending')}</option>
              <option value="adopted">{t('pets.status.adopted')}</option>
            </select>
            <button type="button" className={listBtnGhost} disabled>
              {t('pets.filters.age')}
            </button>
          </div>

        <div className="mt-6 grid grid-cols-2 justify-items-start gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {query.isLoading ? (
            <p className="col-span-full text-sm text-zinc-500">{t('common.loading')}</p>
          ) : query.data?.items?.length ? (
            query.data.items.map((p) => (
              <article
                key={p.id}
                className="w-full max-w-[220px] overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/50"
              >
                <div className="flex h-[96px] items-center justify-center bg-zinc-800 text-[11px] text-zinc-500">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
                  ) : (
                    <span>{t('pets.photoPlaceholder')}</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                    {statusPill(p.status, t)}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{metaLine(p, t)}</p>
                  <Link
                    to={`/pets/${p.id}`}
                    className={cn(
                      focusList,
                      'mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900/90 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800',
                    )}
                  >
                    {t('pets.details')}
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="col-span-full text-sm text-zinc-500">{t('pets.empty')}</p>
          )}
        </div>

          <div className="mt-auto pt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800 text-sm text-zinc-200',
              'disabled:cursor-not-allowed disabled:opacity-40',
              focusList,
            )}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label={t('pets.prev')}
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
            aria-label={t('pets.next')}
          >
            &rsaquo;
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

