import { getPool } from '../../../infra/db/pool';
import type { NgoApplication, NgoApplicationStatus } from '../ngo.types';
import { ExternalServiceError } from '../../../shared/errors';

type StatusUpdateResult = {
  id: string;
  userId: string;
  orgName: string;
  regNumber: string;
  orgAddress: string;
  activityDirection: string;
  contactPhone: string;
  contactEmail: string;
  description: string | null;
  documentPublicId: string;
  documentResourceType: 'image' | 'raw';
  documentFormat: string | null;
  submittedAt: string;
  status: NgoApplicationStatus;
};

export type AdminNgoApplicationListItem = {
  id: string;
  requesterName: string;
  orgName: string;
  submittedAt: string;
  status: NgoApplicationStatus;
};

export async function listApplications(params: {
  q?: string;
  status?: NgoApplicationStatus;
  page: number;
  pageSize: number;
}): Promise<{ items: AdminNgoApplicationListItem[]; total: number }> {
  const pool = getPool();
  const where: string[] = [];
  const values: Array<string | number> = [];

  const q = params.q?.trim();
  if (q) {
    values.push(`%${q}%`);
    where.push(
      `(a.org_name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR (u.last_name || ' ' || u.first_name) ILIKE $${values.length})`,
    );
  }

  if (params.status) {
    values.push(params.status);
    where.push(`a.status = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.pageSize;

  const countRes = await pool.query<{ total: string }>(
    `
    SELECT COUNT(*)::text as total
    FROM ngo_applications a
    JOIN users u ON u.id = a.user_id
    ${whereSql}
  `,
    values,
  );
  const total = Number(countRes.rows[0]?.total ?? 0);

  const listRes = await pool.query<AdminNgoApplicationListItem>(
    `
    SELECT
      a.id,
      COALESCE(NULLIF(TRIM(u.last_name || ' ' || u.first_name), ''), u.email) as "requesterName",
      a.org_name as "orgName",
      a.submitted_at as "submittedAt",
      a.status
    FROM ngo_applications a
    JOIN users u ON u.id = a.user_id
    ${whereSql}
    ORDER BY a.submitted_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `,
    [...values, params.pageSize, offset],
  );

  return { items: listRes.rows, total };
}

export async function getApplicationById(id: string): Promise<NgoApplication | null> {
  const pool = getPool();
  const res = await pool.query<NgoApplication>(
    `
    SELECT
      a.id,
      a.user_id as "userId",
      COALESCE(NULLIF(TRIM(u.last_name || ' ' || u.first_name), ''), u.email) as "requesterName",
      u.email as "requesterEmail",
      a.org_name as "orgName",
      a.reg_number as "regNumber",
      a.org_address as "orgAddress",
      a.activity_direction as "activityDirection",
      a.contact_phone as "contactPhone",
      a.contact_email as "contactEmail",
      a.description,
      a.document_public_id as "documentPublicId",
      a.document_resource_type as "documentResourceType",
      a.document_format as "documentFormat",
      a.document_original_name as "documentOriginalName",
      a.document_bytes as "documentBytes",
      a.submitted_at as "submittedAt",
      a.status
    FROM ngo_applications a
    JOIN users u ON u.id = a.user_id
    WHERE a.id = $1
    LIMIT 1
  `,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function updateApplicationStatus(params: {
  id: string;
  status: NgoApplicationStatus;
  reviewedBy: string;
  note?: string;
}): Promise<NgoApplication | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query<StatusUpdateResult>(
      `
    UPDATE ngo_applications
    SET
      status = $2,
      reviewed_at = NOW(),
      reviewed_by = $3,
      review_note = $4
    WHERE id = $1 AND status = 'pending'
    RETURNING
      id,
      user_id as "userId",
      org_name as "orgName",
      reg_number as "regNumber",
      org_address as "orgAddress",
      activity_direction as "activityDirection",
      contact_phone as "contactPhone",
      contact_email as "contactEmail",
      description,
      document_public_id as "documentPublicId",
      document_resource_type as "documentResourceType",
      document_format as "documentFormat",
      submitted_at as "submittedAt",
      status
  `,
      [params.id, params.status, params.reviewedBy, params.note ?? null],
    );
    const updated = res.rows[0];
    if (!updated) {
      await client.query('ROLLBACK');
      return null;
    }

    if (params.status === 'approved') {
      await client.query(
        `UPDATE users
         SET role = 'ngo',
             updated_at = now()
         WHERE id = $1`,
        [updated.userId],
      );

      await client.query(
        `
        INSERT INTO ngos (
          owner_id,
          application_id,
          org_name,
          reg_number,
          org_address,
          activity_direction,
          contact_phone,
          contact_email,
          description,
          document_public_id,
          document_resource_type,
          document_format,
          document_original_name,
          document_bytes
        )
        SELECT
          user_id,
          id,
          org_name,
          reg_number,
          org_address,
          activity_direction,
          contact_phone,
          contact_email,
          description,
          document_public_id,
          document_resource_type,
          document_format,
          document_original_name,
          document_bytes
        FROM ngo_applications
        WHERE id = $1
        `,
        [params.id],
      );
    }

    await client.query('COMMIT');
    return updated as unknown as NgoApplication;
  } catch {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw new ExternalServiceError('Хүсэлт шинэчлэх үед алдаа гарлаа', 'NGO_ADMIN_UPDATE_FAILED');
  } finally {
    client.release();
  }
}

