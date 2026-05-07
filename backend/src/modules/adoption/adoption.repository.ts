import { getPool } from '../../infra/db/pool';
import { getImageUrl } from '../../shared/storage';
import type {
  AdoptionInboxItem,
  AdoptionRequestDetail,
  CreateAdoptionRequestInput,
  AdoptionRequestCreated,
} from './adoption.types';

export async function createAdoptionRequest(input: CreateAdoptionRequestInput): Promise<AdoptionRequestCreated> {
  const { rows } = await getPool().query<{ id: string }>(
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
  return { id: rows[0]!.id };
}

type InboxRow = {
  id: string;
  pet_id: string;
  pet_name: string;
  requester_id: string;
  requester_email: string;
  requester_first_name: string | null;
  requester_last_name: string | null;
  created_at: string;
  status: string;
};

function requesterName(r: InboxRow): string {
  const full = `${r.requester_first_name ?? ''} ${r.requester_last_name ?? ''}`.trim();
  return full || r.requester_email;
}

export async function countPendingForOwner(ownerId: string): Promise<number> {
  const { rows } = await getPool().query<{ total: string }>(
    `
    SELECT COUNT(*)::text as total
    FROM adoption_requests ar
    JOIN pets p ON p.id = ar.pet_id
    WHERE p.owner_id = $1
      AND ar.status = 'pending'
  `,
    [ownerId],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function listInboxForOwner(ownerId: string, limit: number): Promise<AdoptionInboxItem[]> {
  const { rows } = await getPool().query<InboxRow>(
    `
    SELECT
      ar.id,
      ar.pet_id,
      p.name as pet_name,
      ar.requester_id,
      u.email as requester_email,
      u.first_name as requester_first_name,
      u.last_name as requester_last_name,
      ar.created_at::text as created_at,
      ar.status
    FROM adoption_requests ar
    JOIN pets p ON p.id = ar.pet_id
    JOIN users u ON u.id = ar.requester_id
    WHERE p.owner_id = $1
    ORDER BY ar.created_at DESC
    LIMIT $2
  `,
    [ownerId, limit],
  );

  return rows.map((r) => ({
    id: r.id,
    petId: r.pet_id,
    petName: r.pet_name,
    requesterId: r.requester_id,
    requesterName: requesterName(r),
    createdAt: r.created_at,
    status: r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending',
  }));
}

export async function countPendingForRequester(requesterId: string): Promise<number> {
  const { rows } = await getPool().query<{ total: string }>(
    `
    SELECT COUNT(*)::text as total
    FROM adoption_requests
    WHERE requester_id = $1
      AND status = 'pending'
  `,
    [requesterId],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function listForRequester(requesterId: string, limit: number): Promise<AdoptionInboxItem[]> {
  const { rows } = await getPool().query<InboxRow>(
    `
    SELECT
      ar.id,
      ar.pet_id,
      p.name as pet_name,
      ar.requester_id,
      u.email as requester_email,
      u.first_name as requester_first_name,
      u.last_name as requester_last_name,
      ar.created_at::text as created_at,
      ar.status
    FROM adoption_requests ar
    JOIN pets p ON p.id = ar.pet_id
    JOIN users u ON u.id = ar.requester_id
    WHERE ar.requester_id = $1
    ORDER BY ar.created_at DESC
    LIMIT $2
  `,
    [requesterId, limit],
  );

  return rows.map((r) => ({
    id: r.id,
    petId: r.pet_id,
    petName: r.pet_name,
    requesterId: r.requester_id,
    requesterName: requesterName(r),
    createdAt: r.created_at,
    status: r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending',
  }));
}

type DetailRow = {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_species: string;
  pet_sex: string | null;
  pet_age_years: number | null;
  pet_breed: string | null;
  pet_photo_public_id: string | null;
  requester_id: string;
  requester_email: string;
  requester_first_name: string | null;
  requester_last_name: string | null;
  reason: string;
  living_environment: string;
  has_owned_pet_before: boolean;
  household_size: number | null;
  contact_phone: string | null;
  created_at: string;
  status: string;
};

export async function getRequestDetailForOwner(params: {
  requestId: string;
  ownerId: string;
}): Promise<AdoptionRequestDetail | null> {
  const { rows } = await getPool().query<DetailRow>(
    `
    SELECT
      ar.id,
      ar.pet_id,
      p.name as pet_name,
      p.species as pet_species,
      p.sex as pet_sex,
      p.age_years as pet_age_years,
      p.breed as pet_breed,
      p.photo_public_id as pet_photo_public_id,
      ar.requester_id,
      u.email as requester_email,
      u.first_name as requester_first_name,
      u.last_name as requester_last_name,
      ar.reason,
      ar.living_environment,
      ar.has_owned_pet_before,
      ar.household_size,
      ar.contact_phone,
      ar.created_at::text as created_at,
      ar.status
    FROM adoption_requests ar
    JOIN pets p ON p.id = ar.pet_id
    JOIN users u ON u.id = ar.requester_id
    WHERE ar.id = $1
      AND p.owner_id = $2
    LIMIT 1
  `,
    [params.requestId, params.ownerId],
  );

  const r = rows[0];
  if (!r) return null;
  const photoUrl = r.pet_photo_public_id ? getImageUrl(r.pet_photo_public_id, { width: 640 }) : null;
  const requesterFull = `${r.requester_first_name ?? ''} ${r.requester_last_name ?? ''}`.trim();

  const status = r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending';
  const living =
    r.living_environment === 'house' ? 'house' : r.living_environment === 'other' ? 'other' : 'apartment';

  return {
    id: r.id,
    pet: {
      id: r.pet_id,
      name: r.pet_name,
      species: r.pet_species,
      sex: r.pet_sex,
      ageYears: r.pet_age_years,
      breed: r.pet_breed,
      photoUrl,
    },
    requester: {
      id: r.requester_id,
      name: requesterFull || r.requester_email,
    },
    reason: r.reason,
    livingEnvironment: living,
    hasOwnedPetBefore: Boolean(r.has_owned_pet_before),
    householdSize: r.household_size ?? null,
    contactPhone: r.contact_phone ?? null,
    createdAt: r.created_at,
    status,
  };
}

