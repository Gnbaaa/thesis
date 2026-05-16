import { getPool } from '../../infra/db/pool';
import type { UserProfile, UserProfileStatus, UserPublicProfile } from './users.types';
import { getImageUrl } from '../../shared/storage';

type UserRow = {
  id: string;
  email: string;
  role: string;
  status?: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  avatar_public_id: string | null;
};

function normaliseStatus(raw: string | null | undefined): UserProfileStatus {
  if (raw === 'suspended' || raw === 'closed') return raw;
  return 'active';
}

function mapRow(row: UserRow): UserProfile {
  const avatarUrl = row.avatar_public_id
    ? getImageUrl(row.avatar_public_id, { width: 256 })
    : (row.avatar_url ?? null);
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    phone: row.phone ?? null,
    avatarUrl,
    status: normaliseStatus(row.status),
  };
}

function displayName(row: Pick<UserRow, 'first_name' | 'last_name' | 'email'>): string {
  const full = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  return full || row.email;
}

export async function findMe(userId: string): Promise<UserProfile | null> {
  const { rows } = await getPool().query<UserRow>(
    `SELECT id, email, role, status, first_name, last_name, phone, avatar_url, avatar_public_id
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function findPublicByIds(userIds: string[]): Promise<UserPublicProfile[]> {
  if (!userIds.length) return [];
  const { rows } = await getPool().query<UserRow>(
    `SELECT id, email, role, first_name, last_name, phone, avatar_url, avatar_public_id
     FROM users
     WHERE id = ANY($1::uuid[])`,
    [userIds],
  );
  return rows.map((row) => ({
    id: row.id,
    displayName: displayName(row),
    avatarUrl: row.avatar_public_id ? getImageUrl(row.avatar_public_id, { width: 128 }) : (row.avatar_url ?? null),
    role: row.role,
  }));
}

export async function setAvatarPublicId(params: { userId: string; avatarPublicId: string }): Promise<void> {
  await getPool().query(
    `UPDATE users
     SET avatar_public_id = $2,
         updated_at = now()
     WHERE id = $1`,
    [params.userId, params.avatarPublicId],
  );
}

export async function setRole(params: { userId: string; role: string }): Promise<void> {
  await getPool().query(
    `UPDATE users
     SET role = $2,
         updated_at = now()
     WHERE id = $1`,
    [params.userId, params.role],
  );
}

