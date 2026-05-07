import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';
import { getPool } from '../../infra/db/pool';
import type { AdoptionInboxResponse, CreateAdoptionRequestInput, MyAdoptionResponse } from './adoption.types';
import * as repo from './adoption.repository';

export async function createRequest(input: CreateAdoptionRequestInput) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const petRes = await client.query<{ owner_id: string; status: string }>(
      `SELECT owner_id, status FROM pets WHERE id = $1 LIMIT 1 FOR UPDATE`,
      [input.petId],
    );
    const pet = petRes.rows[0];
    if (!pet) {
      throw new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND');
    }
    if (pet.owner_id === input.requesterId) {
      throw new ForbiddenError(
        'Та өөрийн оруулсан амьтны зар дээр үрчлэлтийн хүсэлт илгээх боломжгүй.',
        'OWN_PET_ADOPTION_NOT_ALLOWED',
      );
    }
    if (pet.status === 'adopted') {
      throw new ConflictError('Энэ амьтны зар дээр хүсэлт хүлээн авах боломжгүй байна.', 'PET_NOT_AVAILABLE');
    }

    let createdId: string;
    try {
      const ins = await client.query<{ id: string }>(
        `
        INSERT INTO adoption_requests (
          pet_id,
          requester_id,
          reason,
          living_environment,
          has_owned_pet_before,
          household_size,
          contact_phone
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
        [
          input.petId,
          input.requesterId,
          input.reason,
          input.livingEnvironment,
          input.hasOwnedPetBefore,
          input.householdSize,
          input.contactPhone,
        ],
      );
      createdId = ins.rows[0]!.id;
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === '23505') {
        throw new ConflictError('Та энэ амьтны зар дээр аль хэдийн хүсэлт илгээсэн байна.', 'ADOPTION_REQUEST_ALREADY_SENT');
      }
      throw err;
    }

    await client.query('COMMIT');
    return { id: createdId };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function getInbox(params: { ownerId: string; limit: number }): Promise<AdoptionInboxResponse> {
  const [pendingCount, items] = await Promise.all([
    repo.countPendingForOwner(params.ownerId),
    repo.listInboxForOwner(params.ownerId, params.limit),
  ]);
  return { pendingCount, items };
}

export async function getMyRequests(params: { requesterId: string; limit: number }): Promise<MyAdoptionResponse> {
  const [pendingCount, items] = await Promise.all([
    repo.countPendingForRequester(params.requesterId),
    repo.listForRequester(params.requesterId, params.limit),
  ]);
  return { pendingCount, items };
}

export async function getRequestDetail(params: { requestId: string; ownerId: string }) {
  const detail = await repo.getRequestDetailForOwner({ requestId: params.requestId, ownerId: params.ownerId });
  if (!detail) {
    throw new NotFoundError('Хүсэлт олдсонгүй', 'ADOPTION_REQUEST_NOT_FOUND');
  }
  return detail;
}

export async function resolveRequest(params: { requestId: string; ownerId: string; action: 'approve' | 'reject' }) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const rRes = await client.query<{ id: string; pet_id: string; status: string }>(
      `
      SELECT ar.id, ar.pet_id, ar.status
      FROM adoption_requests ar
      JOIN pets p ON p.id = ar.pet_id
      WHERE ar.id = $1
        AND p.owner_id = $2
      LIMIT 1
      FOR UPDATE
    `,
      [params.requestId, params.ownerId],
    );
    const row = rRes.rows[0];
    if (!row) {
      throw new NotFoundError('Хүсэлт олдсонгүй', 'ADOPTION_REQUEST_NOT_FOUND');
    }
    if (row.status !== 'pending') {
      throw new ConflictError('Энэ хүсэлт аль хэдийн шийдвэрлэгдсэн байна.', 'ADOPTION_REQUEST_ALREADY_RESOLVED');
    }

    if (params.action === 'reject') {
      await client.query(
        `UPDATE adoption_requests SET status = 'rejected', updated_at = now() WHERE id = $1`,
        [params.requestId],
      );
      await client.query('COMMIT');
      return { ok: true as const };
    }

    // approve
    await client.query(`UPDATE adoption_requests SET status = 'approved', updated_at = now() WHERE id = $1`, [
      params.requestId,
    ]);
    await client.query(`UPDATE pets SET status = 'adopted', updated_at = now() WHERE id = $1`, [row.pet_id]);
    await client.query(
      `
      UPDATE adoption_requests
      SET status = 'rejected', updated_at = now()
      WHERE pet_id = $1
        AND id <> $2
        AND status = 'pending'
    `,
      [row.pet_id, params.requestId],
    );

    await client.query('COMMIT');
    return { ok: true as const };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback
    }
    throw err;
  } finally {
    client.release();
  }
}

