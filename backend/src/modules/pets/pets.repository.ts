import { getPool } from '../../infra/db/pool';
import { getImageUrl } from '../../shared/storage';
import type {
  CreatePetInput,
  OwnerPetActivityReport,
  OwnerPetActivityItem,
  PetDetail,
  PetListItem,
  PetListQuery,
  MyAdoptionRequestStatus,
  PetStatus,
  PetSex,
  PetSpecies,
} from './pets.types';

type Row = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  age_years: number | null;
  status: string;
  photo_public_id: string | null;
};

function mapRow(r: Row): PetListItem {
  const species = (r.species as PetSpecies) ?? 'other';
  const sex = ((r.sex as PetSex) ?? 'unknown') as PetSex;
  const status = (r.status as PetStatus) ?? 'available';
  return {
    id: r.id,
    name: r.name,
    species,
    breed: r.breed ?? null,
    sex,
    ageYears: r.age_years ?? null,
    status,
    photoUrl: r.photo_public_id ? getImageUrl(r.photo_public_id, { width: 640 }) : null,
  };
}

type DetailRow = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  age_years: number | null;
  status: string;
  location: string | null;
  description: string | null;
  photo_public_id: string | null;
  vaccinated: boolean;
  neutered: boolean;
  spayed: boolean;
  created_at: string;
  owner_id: string;
  owner_email: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_role: string;
  owner_avatar_url: string | null;
  owner_avatar_public_id: string | null;
  my_request_status: string | null;
};

function ownerDisplayName(r: DetailRow): string {
  const full = `${r.owner_first_name ?? ''} ${r.owner_last_name ?? ''}`.trim();
  return full || r.owner_email;
}

function mapDetailRow(r: DetailRow): PetDetail {
  const species = (r.species as PetSpecies) ?? 'other';
  const sex = ((r.sex as PetSex) ?? 'unknown') as PetSex;
  const status = (r.status as PetStatus) ?? 'available';
  const photoUrl = r.photo_public_id ? getImageUrl(r.photo_public_id, { width: 1200 }) : null;
  const avatarUrl = r.owner_avatar_public_id
    ? getImageUrl(r.owner_avatar_public_id, { width: 128 })
    : (r.owner_avatar_url ?? null);

  const myRequestStatus =
    r.my_request_status === 'pending' || r.my_request_status === 'approved' || r.my_request_status === 'rejected'
      ? (r.my_request_status as MyAdoptionRequestStatus)
      : undefined;

  return {
    id: r.id,
    name: r.name,
    species,
    breed: r.breed ?? null,
    sex,
    ageYears: r.age_years ?? null,
    status,
    location: r.location ?? null,
    description: r.description ?? null,
    vaccinated: Boolean(r.vaccinated),
    neutered: Boolean(r.neutered),
    spayed: Boolean(r.spayed),
    photoUrl,
    createdAt: r.created_at,
    owner: {
      id: r.owner_id,
      displayName: ownerDisplayName(r),
      avatarUrl,
      role: r.owner_role,
    },
    ...(myRequestStatus ? { myRequestStatus } : {}),
  };
}

export async function listPets(query: PetListQuery): Promise<{ items: PetListItem[]; total: number }> {
  const pool = getPool();
  const where: string[] = [];
  const values: Array<string | number> = [];

  const q = query.q?.trim();
  if (q) {
    values.push(`%${q}%`);
    where.push(`(name ILIKE $${values.length} OR breed ILIKE $${values.length} OR location ILIKE $${values.length})`);
  }

  if (query.species) {
    values.push(query.species);
    where.push(`species = $${values.length}`);
  }

  if (query.sex) {
    values.push(query.sex);
    where.push(`sex = $${values.length}`);
  }

  if (query.status) {
    values.push(query.status);
    where.push(`status = $${values.length}`);
  }

  if (typeof query.minAge === 'number') {
    values.push(query.minAge);
    where.push(`age_years >= $${values.length}`);
  }

  if (typeof query.maxAge === 'number') {
    values.push(query.maxAge);
    where.push(`age_years <= $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (query.page - 1) * query.pageSize;

  const countRes = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text as total FROM pets ${whereSql}`,
    values,
  );
  const total = Number(countRes.rows[0]?.total ?? 0);

  const listRes = await pool.query<Row>(
    `
    SELECT id, name, species, breed, sex, age_years, status, photo_public_id
    FROM pets
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `,
    [...values, query.pageSize, offset],
  );

  return { items: listRes.rows.map(mapRow), total };
}

export async function createPet(input: CreatePetInput): Promise<{ id: string }> {
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO pets (
      owner_id,
      name,
      species,
      breed,
      sex,
      age_years,
      status,
      description,
      photo_public_id,
      vaccinated,
      neutered,
      spayed
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `,
    [
      input.ownerId,
      input.name,
      input.species,
      input.breed,
      input.sex,
      input.ageYears,
      input.status,
      input.description,
      input.photoPublicId,
      input.vaccinated,
      input.neutered,
      input.spayed,
    ],
  );
  return { id: res.rows[0]!.id };
}

export async function findPetById(id: string, requesterId?: string | null): Promise<PetDetail | null> {
  const requester = requesterId?.trim() ? requesterId.trim() : null;
  const { rows } = await getPool().query<DetailRow>(
    `
    SELECT
      p.id,
      p.name,
      p.species,
      p.breed,
      p.sex,
      p.age_years,
      p.status,
      p.location,
      p.description,
      p.photo_public_id,
      p.vaccinated,
      p.neutered,
      p.spayed,
      p.created_at::text as created_at,
      u.id as owner_id,
      u.email as owner_email,
      u.first_name as owner_first_name,
      u.last_name as owner_last_name,
      u.role as owner_role,
      u.avatar_url as owner_avatar_url,
      u.avatar_public_id as owner_avatar_public_id,
      ar.status as my_request_status
    FROM pets p
    JOIN users u ON u.id = p.owner_id
    LEFT JOIN adoption_requests ar
      ON ar.pet_id = p.id
     AND ar.requester_id = $2
    WHERE p.id = $1
    LIMIT 1
  `,
    [id, requester],
  );
  const row = rows[0];
  return row ? mapDetailRow(row) : null;
}

export async function updatePet(input: {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string | null;
  ageYears: number | null;
  description: string | null;
  photoPublicId: string | null;
  vaccinated: boolean;
  neutered: boolean;
  spayed: boolean;
}): Promise<{ id: string } | null> {
  const { rows } = await getPool().query<{ id: string }>(
    `
    UPDATE pets
    SET
      name = $3,
      species = $4,
      sex = $5,
      breed = $6,
      age_years = $7,
      description = $8,
      photo_public_id = $9,
      vaccinated = $10,
      neutered = $11,
      spayed = $12,
      updated_at = now()
    WHERE id = $1 AND owner_id = $2
    RETURNING id
  `,
    [
      input.id,
      input.ownerId,
      input.name,
      input.species,
      input.sex,
      input.breed,
      input.ageYears,
      input.description,
      input.photoPublicId,
      input.vaccinated,
      input.neutered,
      input.spayed,
    ],
  );
  const row = rows[0];
  return row ? { id: row.id } : null;
}

/**
 * Эзэмшигчийн оруулсан амьтны зарын идэвхийн тайлан.
 * Нийт тоо + статусаар задаргаа + сүүлийн N жагсаалт.
 */
export async function getOwnerPetActivityReport(
  ownerId: string,
  options?: { recentLimit?: number },
): Promise<OwnerPetActivityReport> {
  const pool = getPool();
  const limit = Math.min(Math.max(options?.recentLimit ?? 20, 1), 100);

  const statsRes = await pool.query<{ status: string; cnt: string }>(
    `
    SELECT status, COUNT(*)::text AS cnt
    FROM pets
    WHERE owner_id = $1
    GROUP BY status
    `,
    [ownerId],
  );
  const byStatus: Record<PetStatus, number> = { available: 0, pending: 0, adopted: 0 };
  let totalCount = 0;
  for (const row of statsRes.rows) {
    const n = Number(row.cnt);
    totalCount += n;
    if (row.status === 'available' || row.status === 'pending' || row.status === 'adopted') {
      byStatus[row.status as PetStatus] = n;
    }
  }

  const recentRes = await pool.query<{
    id: string;
    name: string;
    species: string;
    status: string;
    photo_public_id: string | null;
    created_at: string;
  }>(
    `
    SELECT id, name, species, status, photo_public_id, created_at
    FROM pets
    WHERE owner_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [ownerId, limit],
  );

  const recent: OwnerPetActivityItem[] = recentRes.rows.map((r) => ({
    id: r.id,
    name: r.name,
    species: ((r.species as PetSpecies) ?? 'other') as PetSpecies,
    status: ((r.status as PetStatus) ?? 'available') as PetStatus,
    photoUrl: r.photo_public_id ? safeImageUrl(r.photo_public_id, 320) : null,
    createdAt: r.created_at,
  }));

  return { totalCount, byStatus, recent };
}

function safeImageUrl(publicId: string, width: number): string | null {
  try {
    return getImageUrl(publicId, { width });
  } catch {
    return null;
  }
}

export async function findPetOwnerId(petId: string): Promise<string | null> {
  const { rows } = await getPool().query<{ owner_id: string }>(
    `SELECT owner_id FROM pets WHERE id = $1 LIMIT 1`,
    [petId],
  );
  return rows[0]?.owner_id ?? null;
}

