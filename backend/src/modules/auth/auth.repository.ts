import type { AuthUser } from './auth.types';
import { getPool } from '../../infra/db/pool';
import { getImageUrl } from '../../shared/storage';
import { normaliseUserStatus, type UserAccountStatus } from './userStatus';

type UserRow = {
  id: string;
  email: string;
  role: string;
  status?: string;
  password_hash?: string | null;
  avatar_url: string | null;
  avatar_public_id?: string | null;
};

function mapRow(row: UserRow): AuthUser {
  const avatarUrl = row.avatar_public_id
    ? getImageUrl(row.avatar_public_id, { width: 256 })
    : row.avatar_url;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    avatarUrl,
    status: normaliseUserStatus(row.status),
  };
}

export async function findUserByGoogleId(googleId: string): Promise<AuthUser | null> {
  const { rows } = await getPool().query<UserRow>(
    `SELECT id, email, role, status, avatar_url, avatar_public_id FROM users WHERE google_id = $1 LIMIT 1`,
    [googleId],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const { rows } = await getPool().query<UserRow>(
    `SELECT id, email, role, status, avatar_url, avatar_public_id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
    [email],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findUserByEmailWithPasswordHash(email: string): Promise<{
  user: AuthUser;
  passwordHash: string | null;
} | null> {
  const { rows } = await getPool().query<UserRow>(
    `SELECT id, email, role, status, avatar_url, avatar_public_id, password_hash
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );
  const row = rows[0];
  if (!row) return null;
  return { user: mapRow(row), passwordHash: row.password_hash ?? null };
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await getPool().query<UserRow>(
    `SELECT id, email, role, status, avatar_url, avatar_public_id FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createUserWithPassword(params: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<AuthUser> {
  const { rows } = await getPool().query<UserRow>(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role, status, avatar_url`,
    [params.email, params.passwordHash, params.firstName, params.lastName, params.phone ?? null],
  );
  const row = rows[0];
  if (!row) throw new Error('Failed to create user');
  return mapRow(row);
}

export async function createPasswordResetToken(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [params.userId, params.tokenHash, params.expiresAt.toISOString()],
  );
}

export async function consumePasswordResetToken(params: {
  tokenHash: string;
}): Promise<{ userId: string } | null> {
  const { rows } = await getPool().query<{ user_id: string }>(
    `UPDATE password_reset_tokens
     SET used_at = now()
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > now()
     RETURNING user_id`,
    [params.tokenHash],
  );
  const row = rows[0];
  return row ? { userId: row.user_id } : null;
}

export async function updateUserPasswordHash(params: {
  userId: string;
  passwordHash: string;
}): Promise<void> {
  await getPool().query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [
    params.userId,
    params.passwordHash,
  ]);
}

export async function createUserFromGoogle(params: {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}): Promise<AuthUser> {
  const { rows } = await getPool().query<UserRow>(
    `INSERT INTO users (email, google_id, first_name, last_name, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role, status, avatar_url`,
    [params.email, params.googleId, params.firstName, params.lastName, params.avatarUrl],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to create user');
  }
  return mapRow(row);
}

export async function linkGoogleToExistingUser(params: {
  userId: string;
  googleId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}): Promise<AuthUser> {
  const { rows } = await getPool().query<UserRow>(
    `UPDATE users
     SET google_id = $2,
         first_name = CASE WHEN first_name = '' THEN $3 ELSE first_name END,
         last_name = CASE WHEN last_name = '' THEN $4 ELSE last_name END,
         avatar_url = CASE WHEN $5::text IS NOT NULL AND $5::text <> '' THEN $5 ELSE avatar_url END,
         updated_at = now()
     WHERE id = $1
     RETURNING id, email, role, status, avatar_url`,
    [params.userId, params.googleId, params.firstName, params.lastName, params.avatarUrl],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to link Google account');
  }
  return mapRow(row);
}


export async function updateGoogleUserProfile(params: {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}): Promise<AuthUser> {
  const { rows } = await getPool().query<UserRow>(
    `UPDATE users
     SET first_name = CASE WHEN $2::text <> '' THEN $2 ELSE first_name END,
         last_name = CASE WHEN $3::text <> '' THEN $3 ELSE last_name END,
         avatar_url = CASE WHEN $4::text IS NOT NULL AND $4::text <> '' THEN $4 ELSE avatar_url END,
         updated_at = now()
     WHERE id = $1
     RETURNING id, email, role, status, avatar_url`,
    [params.userId, params.firstName, params.lastName, params.avatarUrl],
  );
  const row = rows[0];
  if (!row) {
    throw new Error('Failed to update Google profile');
  }
  return mapRow(row);
}


export async function findUserAccountStatusById(
  userId: string,
): Promise<UserAccountStatus | null> {
  const { rows } = await getPool().query<{ status: string }>(
    `SELECT status FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const row = rows[0];
  return row ? normaliseUserStatus(row.status) : null;
}
