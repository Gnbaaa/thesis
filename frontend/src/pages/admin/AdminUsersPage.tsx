import { useEffect, useMemo, useState } from 'react'; // useEffect: only for the search debounce hook
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAdminUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUserListItem,
  type AdminUserListResponse,
  type UserRole,
  type UserStatus,
} from '@/features/admin/adminUsersApi';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAuthUserId } from '@/lib/authSession';
import { catalogPaginationRow } from '@/lib/catalogStyles';
import { cn } from '@/lib/cn';
import { alertError, focusRing } from '@/lib/uiClasses';

type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | UserStatus;

const PAGE_SIZE = 10;

function formatDate(d: string): string {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d.slice(0, 10);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fullName(u: Pick<AdminUserListItem, 'firstName' | 'lastName' | 'email'>): string {
  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return name || u.email;
}

function roleBadgeVariant(r: UserRole): 'warning' | 'success' | 'muted' {
  if (r === 'admin') return 'warning';
  if (r === 'ngo') return 'success';
  return 'muted';
}

function statusBadgeVariant(s: UserStatus): 'success' | 'warning' | 'danger' {
  if (s === 'active') return 'success';
  if (s === 'suspended') return 'warning';
  return 'danger';
}

/** 300ms debounce for the search input — keeps NFR-P2 in mind. */
function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const myId = getAuthUserId();

  const [qInput, setQInput] = useState('');
  const q = useDebounced(qInput, 300);
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      role: role === 'all' ? undefined : role,
      status: status === 'all' ? undefined : status,
      page,
      pageSize: PAGE_SIZE,
    }),
    [q, role, status, page],
  );

  const query = useQuery<AdminUserListResponse>({
    queryKey: ['adminUsers', queryParams],
    queryFn: () => listAdminUsers(queryParams),
    placeholderData: keepPreviousData,
  });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [query.data?.total]);

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const total = query.data?.total ?? 0;

  const selected = useMemo(
    () => items.find((u) => u.id === selectedId) ?? null,
    [items, selectedId],
  );

  function onRoleChange(next: RoleFilter) {
    setRole(next);
    setPage(1);
  }
  function onStatusChange(next: StatusFilter) {
    setStatus(next);
    setPage(1);
  }
  function onSearchChange(next: string) {
    setQInput(next);
    setPage(1);
  }

  return (
    <CenteredPage maxWidth="2xl" className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold leading-tight text-text-heading">
          {t('adminUsers.title')}
        </h1>
        <p className="text-sm text-text-muted">
          {t('adminUsers.totalLabel', { count: total })}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={qInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('adminUsers.searchPh')}
          className={cn(
            'h-10 w-full rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text placeholder:text-text-muted sm:max-w-sm',
            focusRing,
          )}
        />
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as RoleFilter)}
          className={cn(
            'h-10 rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text',
            focusRing,
          )}
        >
          <option value="all">{t('adminUsers.filters.roleAll')}</option>
          <option value="user">{t('adminUsers.roles.user')}</option>
          <option value="ngo">{t('adminUsers.roles.ngo')}</option>
          <option value="admin">{t('adminUsers.roles.admin')}</option>
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className={cn(
            'h-10 rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text',
            focusRing,
          )}
        >
          <option value="all">{t('adminUsers.filters.statusAll')}</option>
          <option value="active">{t('adminUsers.statuses.active')}</option>
          <option value="suspended">{t('adminUsers.statuses.suspended')}</option>
          <option value="closed">{t('adminUsers.statuses.closed')}</option>
        </select>
      </div>

      {query.isError ? (
        <p className={cn(alertError, 'mt-4')} role="alert">
          {t('adminUsers.loadFailed')}
        </p>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-card border border-border-card bg-surface-card">
        <table className="w-full table-fixed">
          <thead className="border-b border-border-card bg-surface-muted">
            <tr className="text-left text-xs font-semibold text-text-muted">
              <th className="px-6 py-3 w-[56px]">{t('adminUsers.cols.no')}</th>
              <th className="px-4 py-3">{t('adminUsers.cols.name')}</th>
              <th className="px-4 py-3 w-[220px]">{t('adminUsers.cols.email')}</th>
              <th className="px-4 py-3 w-[160px]">{t('adminUsers.cols.phone')}</th>
              <th className="px-4 py-3 w-[120px]">{t('adminUsers.cols.role')}</th>
              <th className="px-4 py-3 w-[140px]">{t('adminUsers.cols.status')}</th>
              <th className="px-4 py-3 w-[140px]">{t('adminUsers.cols.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-card text-sm">
            {query.isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                  {t('adminUsers.loading')}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-muted">
                  {t('adminUsers.empty')}
                </td>
              </tr>
            ) : (
              items.map((u, idx) => (
                <tr key={u.id} className="text-text-secondary">
                  <td className="px-6 py-3 text-text-muted">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 text-text">{fullName(u)}</td>
                  <td className="px-4 py-3 text-text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {u.phone || t('adminUsers.noPhone')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant(u.role)}>{t(`adminUsers.roles.${u.role}`)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant(u.status)}>
                      {t(`adminUsers.statuses.${u.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className={cn(
                        'text-sm font-medium text-accent hover:text-accent-hover',
                        focusRing,
                        'rounded-input',
                      )}
                      onClick={() => setSelectedId(u.id)}
                    >
                      {t('adminUsers.details')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className={cn(catalogPaginationRow, 'text-sm text-text-muted')}>
          <span>{t('adminUsers.pageLabel')}</span>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-card bg-surface-card disabled:opacity-50',
              focusRing,
            )}
            aria-label="prev"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = startPage + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm',
                  focusRing,
                  p === page
                    ? 'border-text-heading bg-text-heading text-white'
                    : 'border-border-card bg-surface-card text-text-secondary hover:bg-surface-hover',
                )}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-card bg-surface-card disabled:opacity-50',
              focusRing,
            )}
            aria-label="next"
          >
            ›
          </button>
        </div>
      ) : null}

      {selected ? (
        <UserDrawer
          key={selected.id}
          user={selected}
          isSelf={selected.id === myId}
          onClose={() => setSelectedId(null)}
          onSaved={(updated) => {
            const queryKey = ['adminUsers', queryParams] as const;
            const data = qc.getQueryData<AdminUserListResponse>(queryKey);
            if (data) {
              qc.setQueryData<AdminUserListResponse>(queryKey, {
                ...data,
                items: data.items.map((it) => (it.id === updated.id ? updated : it)),
              });
            }
          }}
        />
      ) : null}
    </CenteredPage>
  );
}

type UserDrawerProps = {
  user: AdminUserListItem;
  isSelf: boolean;
  onClose: () => void;
  onSaved: (next: AdminUserListItem) => void;
};

function UserDrawer({ user, isSelf, onClose, onSaved }: UserDrawerProps) {
  const { t } = useTranslation();
  // Parent нь `key={user.id}` дамжуулдаг тул өөр хэрэглэгч сонгох бүрд энэ
  // компонент шинээр mount хийгдэж, доорх state-ууд анхдагч утгаар
  // эхлүүлэгдэнэ — useEffect-ээр reset хийх шаардлагагүй.
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [feedback, setFeedback] = useState<string | null>(null);

  const roleMutation = useMutation({
    mutationFn: () => updateUserRole(user.id, role),
    onSuccess: (next) => {
      setFeedback(t('adminUsers.drawer.savedRole'));
      onSaved(next);
    },
  });

  const statusMutation = useMutation({
    mutationFn: () => updateUserStatus(user.id, status),
    onSuccess: (next) => {
      setFeedback(t('adminUsers.drawer.savedStatus'));
      onSaved(next);
    },
  });

  const saving = roleMutation.isPending || statusMutation.isPending;

  const roleChanged = role !== user.role;
  const statusChanged = status !== user.status;

  async function save() {
    setFeedback(null);
    if (roleChanged) await roleMutation.mutateAsync();
    if (statusChanged) await statusMutation.mutateAsync();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col gap-5 overflow-y-auto bg-surface-card px-6 py-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-text-heading">
            {t('adminUsers.drawer.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-md p-1.5 text-text-muted hover:bg-surface-hover',
              focusRing,
            )}
            aria-label="close"
          >
            ×
          </button>
        </div>

        <div className="grid gap-3">
          <Field label={t('adminUsers.drawer.fullName')} value={fullName(user)} />
          <Field label={t('adminUsers.drawer.email')} value={user.email} />
          <Field label={t('adminUsers.drawer.phone')} value={user.phone || t('adminUsers.noPhone')} />
          <Field label={t('adminUsers.drawer.joined')} value={formatDate(user.createdAt)} />
        </div>

        <div className="border-t border-border-card pt-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text-secondary">
              {t('adminUsers.drawer.role')}
            </span>
            <select
              value={role}
              disabled={isSelf || saving}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={cn(
                'h-10 rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text disabled:opacity-60',
                focusRing,
              )}
            >
              <option value="user">{t('adminUsers.roles.user')}</option>
              <option value="ngo">{t('adminUsers.roles.ngo')}</option>
              <option value="admin">{t('adminUsers.roles.admin')}</option>
            </select>
          </label>
        </div>

        <div>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-text-secondary">
              {t('adminUsers.drawer.status')}
            </span>
            <select
              value={status}
              disabled={isSelf || saving}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className={cn(
                'h-10 rounded-lg border border-border-input bg-surface-card px-3 text-sm text-text disabled:opacity-60',
                focusRing,
              )}
            >
              <option value="active">{t('adminUsers.statuses.active')}</option>
              <option value="suspended">{t('adminUsers.statuses.suspended')}</option>
              <option value="closed">{t('adminUsers.statuses.closed')}</option>
            </select>
          </label>
        </div>

        {isSelf ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            {t('adminUsers.drawer.selfDisabled')}
          </p>
        ) : null}

        {feedback ? (
          <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {feedback}
          </p>
        ) : null}

        <div className="mt-auto flex justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={isSelf || saving || (!roleChanged && !statusChanged)}
            onClick={save}
          >
            {saving ? t('adminUsers.drawer.saving') : t('adminUsers.drawer.save')}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}
