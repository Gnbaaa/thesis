import { getPool } from '../../infra/db/pool';
import { getImageUrl } from '../../shared/storage';
import type {
  CreateVolunteerPostInput,
  UpdateVolunteerPostInput,
  VolunteerPostDetail,
  VolunteerPostListItem,
  VolunteerPostListQuery,
  VolunteerPostStatus,
} from './volunteer.types';

type ListRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  required_count: number;
  status: string;
  photo_public_id: string | null;
  created_at: string;
};

type DetailRow = ListRow & {
  updated_at: string;
  owner_id: string;
  owner_email: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_role: string;
  owner_avatar_url: string | null;
  owner_avatar_public_id: string | null;
  registered_count: string;
  viewer_registered: boolean | null;
};

function normaliseStatus(raw: string): VolunteerPostStatus {
  return raw === 'completed' ? 'completed' : 'active';
}

function safePhotoUrl(publicId: string | null, width: number): string | null {
  if (!publicId) return null;
  try {
    return getImageUrl(publicId, { width });
  } catch {
    return null;
  }
}

function mapListRow(r: ListRow): VolunteerPostListItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    location: r.location,
    eventDate: r.event_date.slice(0, 10),
    requiredCount: Number(r.required_count),
    status: normaliseStatus(r.status),
    photoUrl: safePhotoUrl(r.photo_public_id, 800),
    createdAt: r.created_at,
  };
}

function ownerDisplayName(r: DetailRow): string {
  const full = `${r.owner_first_name ?? ''} ${r.owner_last_name ?? ''}`.trim();
  return full || r.owner_email;
}

function mapDetailRow(r: DetailRow): VolunteerPostDetail {
  return {
    ...mapListRow(r),
    photoUrl: safePhotoUrl(r.photo_public_id, 1200),
    updatedAt: r.updated_at,
    owner: {
      id: r.owner_id,
      displayName: ownerDisplayName(r),
      avatarUrl:
        safePhotoUrl(r.owner_avatar_public_id, 128) ?? r.owner_avatar_url ?? null,
      role: r.owner_role,
    },
    registeredCount: Number(r.registered_count ?? 0),
    isRegisteredByViewer: Boolean(r.viewer_registered),
  };
}

export async function listVolunteerPosts(
  query: VolunteerPostListQuery,
): Promise<{ items: VolunteerPostListItem[]; total: number }> {
  const pool = getPool();
  const where: string[] = [];
  const values: Array<string | number> = [];

  const q = query.q?.trim();
  if (q) {
    values.push(`%${q}%`);
    where.push(
      `(title ILIKE $${values.length} OR description ILIKE $${values.length} OR location ILIKE $${values.length})`,
    );
  }

  if (query.status) {
    values.push(query.status);
    where.push(`status = $${values.length}`);
  }

  if (query.location) {
    values.push(query.location);
    where.push(`location = $${values.length}`);
  }

  if (typeof query.lastDays === 'number') {
    values.push(query.lastDays);
    where.push(`created_at >= NOW() - ($${values.length}::int * INTERVAL '1 day')`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (query.page - 1) * query.pageSize;

  const countRes = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text as total FROM volunteer_posts ${whereSql}`,
    values,
  );
  const total = Number(countRes.rows[0]?.total ?? 0);

  const listRes = await pool.query<ListRow>(
    `
    SELECT
      id,
      title,
      description,
      location,
      event_date::text AS event_date,
      required_count,
      status,
      photo_public_id,
      created_at::text AS created_at
    FROM volunteer_posts
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
    `,
    [...values, query.pageSize, offset],
  );

  return { items: listRes.rows.map(mapListRow), total };
}

export async function findVolunteerPostById(
  id: string,
  viewerId: string | null,
): Promise<VolunteerPostDetail | null> {
  const { rows } = await getPool().query<DetailRow>(
    `
    SELECT
      p.id,
      p.title,
      p.description,
      p.location,
      p.event_date::text AS event_date,
      p.required_count,
      p.status,
      p.photo_public_id,
      p.created_at::text AS created_at,
      p.updated_at::text AS updated_at,
      u.id AS owner_id,
      u.email AS owner_email,
      u.first_name AS owner_first_name,
      u.last_name AS owner_last_name,
      u.role AS owner_role,
      u.avatar_url AS owner_avatar_url,
      u.avatar_public_id AS owner_avatar_public_id,
      (SELECT COUNT(*)::text FROM volunteer_registrations r WHERE r.post_id = p.id) AS registered_count,
      CASE
        WHEN $2::uuid IS NULL THEN FALSE
        ELSE EXISTS (
          SELECT 1 FROM volunteer_registrations r
          WHERE r.post_id = p.id AND r.user_id = $2::uuid
        )
      END AS viewer_registered
    FROM volunteer_posts p
    JOIN users u ON u.id = p.owner_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [id, viewerId],
  );
  const row = rows[0];
  return row ? mapDetailRow(row) : null;
}

export async function createVolunteerRegistration(
  postId: string,
  userId: string,
): Promise<{ created: boolean }> {
  const { rowCount } = await getPool().query(
    `
    INSERT INTO volunteer_registrations (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING
    `,
    [postId, userId],
  );
  return { created: (rowCount ?? 0) > 0 };
}

export async function deleteVolunteerRegistration(
  postId: string,
  userId: string,
): Promise<{ deleted: boolean }> {
  const { rowCount } = await getPool().query(
    `DELETE FROM volunteer_registrations WHERE post_id = $1 AND user_id = $2`,
    [postId, userId],
  );
  return { deleted: (rowCount ?? 0) > 0 };
}

export async function findVolunteerPostOwnerId(id: string): Promise<string | null> {
  const { rows } = await getPool().query<{ owner_id: string }>(
    `SELECT owner_id FROM volunteer_posts WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0]?.owner_id ?? null;
}

export async function createVolunteerPost(input: CreateVolunteerPostInput): Promise<{ id: string }> {
  const { rows } = await getPool().query<{ id: string }>(
    `
    INSERT INTO volunteer_posts (
      owner_id,
      title,
      description,
      location,
      event_date,
      required_count,
      status,
      photo_public_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      input.ownerId,
      input.title,
      input.description,
      input.location,
      input.eventDate,
      input.requiredCount,
      input.status,
      input.photoPublicId,
    ],
  );
  return { id: rows[0]!.id };
}

export async function updateVolunteerPost(
  input: UpdateVolunteerPostInput,
): Promise<{ id: string } | null> {
  const { rows } = await getPool().query<{ id: string }>(
    `
    UPDATE volunteer_posts
    SET
      title = $3,
      description = $4,
      location = $5,
      event_date = $6,
      required_count = $7,
      status = $8,
      photo_public_id = $9,
      updated_at = NOW()
    WHERE id = $1 AND owner_id = $2
    RETURNING id
    `,
    [
      input.id,
      input.ownerId,
      input.title,
      input.description,
      input.location,
      input.eventDate,
      input.requiredCount,
      input.status,
      input.photoPublicId,
    ],
  );
  const row = rows[0];
  return row ? { id: row.id } : null;
}
