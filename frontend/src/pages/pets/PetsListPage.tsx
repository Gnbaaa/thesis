import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PetStatusBadge } from '@/features/pets/petStatusBadge';
import { Button } from '@/components/ui/Button';
import { listPets, type PetListResponse, type PetSex, type PetSpecies, type PetStatus } from '@/features/pets/petsApi';
import { useIsLoggedIn } from '@/lib/authSession';
import {
  catalogBtnDisabled,
  catalogCard,
  catalogCardLink,
  catalogCardImage,
  catalogCardMedia,
  catalogCardMediaEmpty,
  catalogFocus,
  catalogPageBtn,
  catalogPageBtnActive,
  catalogSearchGrow,
  catalogSearchRow,
  catalogSelect,
} from '@/lib/catalogStyles';
import { cn } from '@/lib/cn';

const pageSize = 8;

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
    <div className="w-full">
      <div className="flex min-h-[60vh] flex-col">
        <div className={catalogSearchRow}>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t('pets.search')}
            className={cn(catalogSearchGrow, catalogFocus)}
            autoComplete="off"
          />
          {loggedIn ? (
            <Link to="/pets/new" className="shrink-0">
              <Button size="sm" className="h-9 w-full sm:w-auto">
                {t('pets.add')}
              </Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <select
            value={species}
            onChange={(e) => {
              setSpecies(e.target.value as 'all' | PetSpecies);
              setPage(1);
            }}
            className={cn(catalogSelect, catalogFocus)}
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
            className={cn(catalogSelect, catalogFocus)}
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
            className={cn(catalogSelect, catalogFocus)}
          >
            <option value="all">{t('pets.filters.status')}</option>
            <option value="available">{t('pets.status.available')}</option>
            <option value="pending">{t('pets.status.pending')}</option>
            <option value="adopted">{t('pets.status.adopted')}</option>
          </select>
          <button type="button" className={catalogBtnDisabled} disabled>
            {t('pets.filters.age')}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {query.isLoading ? (
            <p className="col-span-full text-sm text-text-muted">{t('common.loading')}</p>
          ) : query.data?.items?.length ? (
            query.data.items.map((p) => (
              <article key={p.id} className={catalogCard}>
                <div className={catalogCardMedia}>
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" className={catalogCardImage} loading="lazy" />
                  ) : (
                    <span className={catalogCardMediaEmpty}>{t('pets.photoPlaceholder')}</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-text-heading">{p.name}</h3>
                    <PetStatusBadge status={p.status} t={t} />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{metaLine(p, t)}</p>
                  <Link to={`/pets/${p.id}`} className={cn(catalogCardLink, catalogFocus)}>
                    {t('pets.details')}
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="col-span-full text-sm text-text-muted">{t('pets.empty')}</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-center gap-2 pt-10">
          <button
            type="button"
            className={cn(catalogPageBtn, catalogFocus)}
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
            aria-label={t('pets.next')}
          >
            &rsaquo;
          </button>
        </div>
      </div>
    </div>
  );
}
