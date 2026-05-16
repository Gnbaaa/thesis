import { getPool } from '../../../infra/db/pool';
import { getImageUrl } from '../../../shared/storage';
import type {
  AdminUserListItem,
  AdminUserListQuery,
  AdminUserListResult,
  UserRole,
  UserStatus,
} from './admin.types';

type Row = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  avatar_public_id: string | null;
  created_at: string;
};

function normaliseRole(r: string): UserRole {
  return r === 'ngo' || r === 'admin' ? r : 'user';
}

function normaliseStatus(s: string): UserStatus {
  return s === 'suspended' || s === 'closed' ? s : 'active';
}

function safeAvatar(publicId: string | null, fallback: string | null): string | null {
  if (publicId) {
    try {
      return getImageUrl(publicId, { width: 128 });
    } catch {
      // fall through
    }
  }
  return fallback;
}

function mapRow(r: Row): AdminUserListItem {
  return {
    id: r.id,
    email: r.email,
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    phone: r.phone ?? null,
    role: normaliseRole(r.role),
    status: normaliseStatus(r.status),
    avatarUrl: safeAvatar(r.avatar_public_id, r.avatar_url),
    createdAt: r.created_at,
  };
}

export async function listAdminUsers(query: AdminUserListQuery): Promise<AdminUserListResult> {
  const pool = getPool();
  const where: string[] = [];
  const values: unknown[] = [];

  const q = query.q?.trim();
  if (q) {
    values.push(`%${q}%`);
    const ix = values.length;
    where.push(
      `(email ILIKE $${ix} OR first_name ILIKE $${ix} OR last_name ILIKE $${ix} OR phone ILIKE $${ix})`,
    );
  }
  if (query.role) {
    values.push(query.role);
    where.push(`role = $${values.length}`);
  }
  if (query.status) {
    values.push(query.status);
    where.push(`status = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRes = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM users ${whereSql}`,
    values,
  );
  const total = Number(countRes.rows[0]?.total ?? 0);

  values.push(query.pageSize);
  values.push((query.page - 1) * query.pageSize);
  const limitIx = values.length - 1;
  const offsetIx = values.length;

  const rowsRes = await pool.query<Row>(
    `
    SELECT
      id, email, first_name, last_name, phone, role, status,
      avatar_url, avatar_public_id, created_at
    FROM users
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${limitIx} OFFSET $${offsetIx}
    `,
    values,
  );

  return {
    items: rowsRes.rows.map(mapRow),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function findAdminUserById(id: string): Promise<AdminUserListItem | null> {
  const { rows } = await getPool().query<Row>(
    `
    SELECT id, email, first_name, last_name, phone, role, status,
           avatar_url, avatar_public_id, created_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function updateUserRole(id: string, role: UserRole): Promise<{ updated: boolean }> {
  const { rowCount } = await getPool().query(
    `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1`,
    [id, role],
  );
  return { updated: (rowCount ?? 0) > 0 };
}

export async function updateUserStatus(
  id: string,
  status: UserStatus,
): Promise<{ updated: boolean }> {
  const { rowCount } = await getPool().query(
    `UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1`,
    [id, status],
  );
  return { updated: (rowCount ?? 0) > 0 };
}
